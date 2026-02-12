using API.Data;
using API.DTOs;
using API.Entities;
using API.Entities.OrderAggregate;
using API.Extensions;
using API.RequestHelpers;
using API.Services;
using AutoMapper;
using System;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    public record ProductClickDto(string SessionId);

    public class ProductsController(StoreContext context, IMapper mapper, 
        ImageService imageService) : BaseApiController
    {
        [HttpGet]
        public async Task<ActionResult<List<Product>>> GetProducts(
            [FromQuery] ProductParams productParams)
        {
            // Start with base query applying search and scalar filters.
            // Sorting is applied later because some sorts may depend on other tables (e.g. clicks).
            var query = context.Products
                .Search(productParams.SearchTerm)
                .Filter(
                    productParams.Generos,
                    productParams.Anos,
                    productParams.HasDiscount,
                    productParams.Marcas,
                    productParams.Modelos,
                    productParams.Tipos,
                    productParams.Capacidades,
                    productParams.Cores,
                    productParams.Materiais,
                    productParams.Tamanhos)
                .AsQueryable();

            // Parse category and campaign id strings into lists
            var categoryList = new List<int>();
            if (!string.IsNullOrEmpty(productParams.CategoryIds))
            {
                categoryList.AddRange(productParams.CategoryIds.Split(",", StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => { if (int.TryParse(s.Trim(), out var v)) return v; return -1; })
                    .Where(v => v > 0));
            }

            var campaignList = new List<int>();
            if (!string.IsNullOrEmpty(productParams.CampaignIds))
            {
                campaignList.AddRange(productParams.CampaignIds.Split(",", StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => { if (int.TryParse(s.Trim(), out var v)) return v; return -1; })
                    .Where(v => v > 0));
            }

            // If category filters are present, fetch matching product ids via the relationship
            // This avoids EF trying to materialize collection navigations during translation.
            if (categoryList.Count > 0)
            {
                var productIds = await context.Categories
                    .Where(c => categoryList.Contains(c.Id))
                    .SelectMany(c => c.Products!.Select(p => p.Id))
                    .Distinct()
                    .ToListAsync();

                query = query.Where(p => productIds.Contains(p.Id));
            }

            if (campaignList.Count > 0)
            {
                var productIds = await context.Campaigns
                    .Where(c => campaignList.Contains(c.Id))
                    .SelectMany(c => c.Products!.Select(p => p.Id))
                    .Distinct()
                    .ToListAsync();

                query = query.Where(p => productIds.Contains(p.Id));
            }

            // Apply sorting after filters.
            // Support click-based sorting for "Mais procurados".
            if (!string.IsNullOrWhiteSpace(productParams.OrderBy) &&
                (productParams.OrderBy == "clicksDesc" || productParams.OrderBy == "clicks"))
            {
                var clickCounts = context.ProductClicks
                    .AsNoTracking()
                    .GroupBy(c => c.ProductId)
                    .Select(g => new { ProductId = g.Key, Clicks = g.LongCount() });

                var joined = query.GroupJoin(
                    clickCounts,
                    p => p.Id,
                    c => c.ProductId,
                    (p, cg) => new { Product = p, Clicks = cg.Select(x => x.Clicks).FirstOrDefault() });

                query = productParams.OrderBy == "clicksDesc"
                    ? joined.OrderByDescending(x => x.Clicks).ThenBy(x => x.Product.Name).Select(x => x.Product)
                    : joined.OrderBy(x => x.Clicks).ThenBy(x => x.Product.Name).Select(x => x.Product);
            }
            else
            {
                query = query.Sort(productParams.OrderBy);
            }

            // include navigation properties after filtering/sorting to keep EF translation simple
            query = query.Include(p => p.Campaigns).Include(p => p.Categories);

            var products = await PagedList<Product>.ToPagedList(query,
                productParams.PageNumber, productParams.PageSize);

            Response.AddPaginationHeader(products.Metadata);

            // if user is authenticated, mark products that are in their favorites
            if (User?.Identity?.IsAuthenticated ?? false)
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userId))
                {
                    var favIds = await context.Favorites
                        .Where(f => f.UserId == userId)
                        .Select(f => f.ProductId)
                        .ToListAsync();

                    foreach (var p in products)
                    {
                        p.IsFavorite = favIds.Contains(p.Id);
                    }
                }
            }

            return products;
        }

        [HttpGet("{id}")] // api/products/2
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            // include campaigns and categories so the returned product contains related data
            var product = await context.Products
                .Include(p => p.Campaigns)
                .Include(p => p.Categories)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null) return NotFound();

            if (User?.Identity?.IsAuthenticated ?? false)
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrEmpty(userId))
                {
                    var exists = await context.Favorites.AnyAsync(f => f.UserId == userId && f.ProductId == product.Id);
                    product.IsFavorite = exists;
                }
            }

            return product;
        }

        [HttpGet("{id:int}/reviews")]
        [AllowAnonymous]
        public async Task<ActionResult<List<ProductReviewDto>>> GetProductReviews(int id, CancellationToken ct)
        {
            var exists = await context.Products.AsNoTracking().AnyAsync(p => p.Id == id, ct);
            if (!exists) return NotFound();

            var reviews = await context.ProductReviews
                .AsNoTracking()
                .Where(r => r.ProductId == id)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new ProductReviewDto
                {
                    Id = r.Id,
                    ProductId = r.ProductId,
                    OrderId = r.OrderId,
                    BuyerEmail = r.BuyerEmail,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync(ct);

            return reviews;
        }

        [HttpPost("{id:int}/reviews")]
        [Authorize]
        public async Task<ActionResult<ProductReviewDto>> CreateProductReview(int id, [FromBody] CreateProductReviewDto dto, CancellationToken ct)
        {
            if (dto == null) return BadRequest("Dados inválidos");

            var rating = dto.Rating;
            if (rating < 1 || rating > 5) return BadRequest("Classificação inválida");

            var comment = (dto.Comment ?? string.Empty).Trim();
            if (comment.Length < 3) return BadRequest("Comentário demasiado curto");
            if (comment.Length > 1000) return BadRequest("Comentário demasiado longo");

            var product = await context.Products.FirstOrDefaultAsync(p => p.Id == id, ct);
            if (product == null) return NotFound();

            var email = User.GetEmail();
            if (string.IsNullOrWhiteSpace(email)) return Unauthorized();

            // Only allow reviews from real buyers, after delivery/review request.
            var eligibleOrder = await context.Orders
                .AsNoTracking()
                .Where(o => o.BuyerEmail == email)
                .Where(o => o.OrderStatus == OrderStatus.Delivered || o.OrderStatus == OrderStatus.ReviewRequested || o.OrderStatus == OrderStatus.Completed)
                .Where(o => o.OrderItems.Any(oi => oi.ItemOrdered.ProductId == id))
                .OrderByDescending(o => o.OrderDate)
                .FirstOrDefaultAsync(ct);

            if (eligibleOrder == null)
                return BadRequest("Só pode avaliar produtos que comprou e recebeu");

            var already = await context.ProductReviews
                .AsNoTracking()
                .AnyAsync(r => r.ProductId == id && r.BuyerEmail == email && r.OrderId == eligibleOrder.Id, ct);

            if (already) return BadRequest("Já avaliou este produto nesta encomenda");

            var review = new ProductReview
            {
                ProductId = id,
                OrderId = eligibleOrder.Id,
                BuyerEmail = email,
                Rating = rating,
                Comment = comment,
                CreatedAt = DateTime.UtcNow
            };

            context.ProductReviews.Add(review);
            await context.SaveChangesAsync(ct);

            // Update product cached rating stats (AverageRating/RatingsCount)
            var stats = await context.ProductReviews
                .AsNoTracking()
                .Where(r => r.ProductId == id)
                .GroupBy(_ => 1)
                .Select(g => new { Avg = g.Average(x => x.Rating), Count = g.Count() })
                .FirstOrDefaultAsync(ct);

            product.AverageRating = stats == null ? null : Math.Round(stats.Avg, 2);
            product.RatingsCount = stats?.Count ?? 0;
            await context.SaveChangesAsync(ct);

            var dtoOut = new ProductReviewDto
            {
                Id = review.Id,
                ProductId = review.ProductId,
                OrderId = review.OrderId,
                BuyerEmail = review.BuyerEmail,
                Rating = review.Rating,
                Comment = review.Comment,
                CreatedAt = review.CreatedAt
            };

            return Ok(dtoOut);
        }

        // Track a view/click on the product details page.
        // Anonymous allowed; we dedupe by (ProductId, SessionId) within a short window.
        [HttpPost("{id}/click")]
        public async Task<IActionResult> TrackProductClick(int id, [FromBody] ProductClickDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.SessionId)) return BadRequest("SessionId is required");

            // Ensure product exists (avoid FK failures)
            var exists = await context.Products.AnyAsync(p => p.Id == id);
            if (!exists) return NotFound();

            var windowStart = DateTime.UtcNow.AddMinutes(-5);
            var alreadyCounted = await context.ProductClicks.AnyAsync(c =>
                c.ProductId == id &&
                c.SessionId == dto.SessionId &&
                c.CreatedAt >= windowStart);

            if (alreadyCounted) return Ok();

            var userId = User?.Identity?.IsAuthenticated ?? false
                ? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                : null;

            context.ProductClicks.Add(new ProductClick
            {
                ProductId = id,
                SessionId = dto.SessionId.Trim(),
                UserId = userId,
                UserAgent = Request.Headers.UserAgent.ToString(),
                CreatedAt = DateTime.UtcNow
            });

            await context.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("filters")]
        public async Task<IActionResult> GetFilters()
        {
            // return distinct generos and publication years available for filters
            var generos = await context.Products
                .Where(p => p.Genero != null)
                .Select(p => p.Genero)
                .Distinct()
                .ToListAsync();

            var anos = await context.Products
                .Where(p => p.PublicationYear.HasValue)
                .Select(p => p.PublicationYear!.Value)
                .Distinct()
                .OrderByDescending(x => x)
                .ToListAsync();

            // include available categories and campaigns for filter UI
            var categories = await context.Categories
                .Where(c => c.IsActive)
                .Select(c => new { c.Id, c.Name, c.Slug, c.IsActive })
                .ToListAsync();

            var campaigns = await context.Campaigns
                .Where(c => c.IsActive)
                .Select(c => new { c.Id, c.Name, c.Slug, c.IsActive })
                .ToListAsync();

            var marcas = await context.Products
                .Where(p => p.Marca != null)
                .Select(p => p.Marca)
                .Distinct()
                .ToListAsync();

            var modelos = await context.Products
                .Where(p => p.Modelo != null)
                .Select(p => p.Modelo)
                .Distinct()
                .ToListAsync();

            var tipos = await context.Products
                .Where(p => p.Tipo != null)
                .Select(p => p.Tipo)
                .Distinct()
                .ToListAsync();

            var capacidades = await context.Products
                .Where(p => p.Capacidade != null)
                .Select(p => p.Capacidade)
                .Distinct()
                .ToListAsync();

            var cores = await context.Products
                .Where(p => p.Cor != null)
                .Select(p => p.Cor)
                .Distinct()
                .ToListAsync();

            var materiais = await context.Products
                .Where(p => p.Material != null)
                .Select(p => p.Material)
                .Distinct()
                .ToListAsync();

            var tamanhos = await context.Products
                .Where(p => p.Tamanho != null)
                .Select(p => p.Tamanho)
                .Distinct()
                .ToListAsync();

            return Ok(new { generos, anos, categories, campaigns, marcas, modelos, tipos, capacidades, cores, materiais, tamanhos });
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<Product>> CreateProduct([FromForm] CreateProductDto productDto)
        {

            var product = mapper.Map<Product>(productDto);

            if (productDto.File != null)
            {
                var imageResult = await imageService.AddImageAsync(productDto.File);

                if (imageResult.Error != null)
                {
                    return BadRequest(imageResult.Error.Message);
                }

                product.PictureUrl = imageResult.SecureUrl.AbsoluteUri;
                product.PublicId = imageResult.PublicId;
            }

            // handle multiple secondary image uploads
            if (productDto.SecondaryFiles != null && productDto.SecondaryFiles.Any())
            {
                product.SecondaryImages ??= new List<string>();
                product.SecondaryImagePublicIds ??= new List<string>();
                foreach (var file in productDto.SecondaryFiles)
                {
                    var secResult = await imageService.AddImageAsync(file);
                    if (secResult.Error != null)
                        return BadRequest(secResult.Error.Message);

                    product.SecondaryImages.Add(secResult.SecureUrl.AbsoluteUri);
                    product.SecondaryImagePublicIds.Add(secResult.PublicId);
                }
            }

            // Ensure publication year from form ('anoPublicacao') is applied in case model binding missed it
            IFormCollection? formData = null;
            if (Request.HasFormContentType)
            {
                formData = await Request.ReadFormAsync();
                if (formData.TryGetValue("anoPublicacao", out var yearValues))
                {
                    if (int.TryParse(yearValues.FirstOrDefault(), out var year))
                    {
                        product.PublicationYear = year;
                    }
                }
            }

            // assign campaigns and categories if provided
            if (productDto.CampaignIds != null && productDto.CampaignIds.Any())
            {
                product.Campaigns = await context.Campaigns
                    .Where(c => productDto.CampaignIds.Contains(c.Id))
                    .ToListAsync();
            }

            if (productDto.CategoryIds != null && productDto.CategoryIds.Any())
            {
                product.Categories = await context.Categories
                    .Where(c => productDto.CategoryIds.Contains(c.Id))
                    .ToListAsync();
            }

            context.Products.Add(product);

            var result = await context.SaveChangesAsync() > 0;

            if (result) return CreatedAtAction(nameof(GetProduct), new { Id = product.Id }, product);

            return BadRequest(new { message = "Problem creating new product" });
        }

        [Authorize(Roles = "Admin")]
        [HttpPut]
        public async Task<ActionResult> UpdateProduct([FromForm] UpdateProductDto updateProductDto)
        {
            var product = await context.Products
                .Include(p => p.Campaigns)
                .Include(p => p.Categories)
                .FirstOrDefaultAsync(p => p.Id == updateProductDto.Id);

            if (product == null) return NotFound();


            mapper.Map(updateProductDto, product);

            if (updateProductDto.File != null) 
            {
                var imageResult = await imageService.AddImageAsync(updateProductDto.File);

                if (imageResult.Error != null)
                    return BadRequest(imageResult.Error.Message);

                if (!string.IsNullOrEmpty(product.PublicId))
                    await imageService.DeleteImageAsync(product.PublicId);

                product.PictureUrl = imageResult.SecureUrl.AbsoluteUri;
                product.PublicId = imageResult.PublicId;
            }

            // handle newly uploaded secondary images
            if (updateProductDto.SecondaryFiles != null && updateProductDto.SecondaryFiles.Any())
            {
                product.SecondaryImages ??= new List<string>();
                product.SecondaryImagePublicIds ??= new List<string>();
                foreach (var file in updateProductDto.SecondaryFiles)
                {
                    var secResult = await imageService.AddImageAsync(file);
                    if (secResult.Error != null)
                        return BadRequest(secResult.Error.Message);

                    product.SecondaryImages.Add(secResult.SecureUrl.AbsoluteUri);
                    product.SecondaryImagePublicIds.Add(secResult.PublicId);
                }
            }

            // handle removal of existing secondary images (by publicId or URL)
            if (updateProductDto.RemovedSecondaryImages != null && updateProductDto.RemovedSecondaryImages.Any())
            {
                product.SecondaryImages = product.SecondaryImages ?? new List<string>();
                product.SecondaryImagePublicIds = product.SecondaryImagePublicIds ?? new List<string>();

                // copy to avoid mutation during iteration
                var toRemove = updateProductDto.RemovedSecondaryImages.ToList();

                foreach (var identifier in toRemove)
                {
                    // if identifier matches a publicId we have stored, delete via Cloudinary
                    if (product.SecondaryImagePublicIds != null && product.SecondaryImagePublicIds.Contains(identifier))
                    {
                        try
                        {
                            await imageService.DeleteImageAsync(identifier);
                        }
                        catch { /* swallow deletion errors, proceed to remove from lists */ }

                        var idx = product.SecondaryImagePublicIds.IndexOf(identifier);
                        if (idx >= 0 && product.SecondaryImages != null && idx < product.SecondaryImages.Count)
                        {
                            product.SecondaryImages.RemoveAt(idx);
                        }
                        product.SecondaryImagePublicIds.Remove(identifier);
                    }
                    else
                    {
                        // treat identifier as URL - remove URL and any matching publicId at same index
                        if (product.SecondaryImages != null && product.SecondaryImages.Contains(identifier))
                        {
                            var idx = product.SecondaryImages.IndexOf(identifier);
                            // if there's a publicId at same index, attempt deletion
                            if (product.SecondaryImagePublicIds != null && idx >= 0 && idx < product.SecondaryImagePublicIds.Count)
                            {
                                var pid = product.SecondaryImagePublicIds[idx];
                                if (!string.IsNullOrEmpty(pid))
                                {
                                    try { await imageService.DeleteImageAsync(pid); } catch { }
                                }
                                product.SecondaryImagePublicIds.RemoveAt(idx);
                            }
                            product.SecondaryImages.Remove(identifier);
                        }
                    }
                }
            }

            // Ensure publication year from form ('anoPublicacao') is applied in case model binding missed it
            IFormCollection? formData = null;
            if (Request.HasFormContentType)
            {
                formData = await Request.ReadFormAsync();
                if (formData.TryGetValue("anoPublicacao", out var yearValues))
                {
                    if (int.TryParse(yearValues.FirstOrDefault(), out var year))
                    {
                        product.PublicationYear = year;
                    }
                }
            }

            // update campaigns/categories if provided. Also treat the presence of the
            // keys in the multipart form as an explicit update (even when empty)
            if (updateProductDto.CampaignIds != null || (formData != null && formData.ContainsKey("campaignIds_present")))
            {
                var ids = updateProductDto.CampaignIds ?? new List<int>();
                var selectedCampaigns = await context.Campaigns
                    .Where(c => ids.Contains(c.Id))
                    .ToListAsync();

                product.Campaigns ??= new List<Campaign>();
                product.Campaigns.Clear();
                foreach (var c in selectedCampaigns)
                {
                    product.Campaigns.Add(c);
                }
            }

            if (updateProductDto.CategoryIds != null || (formData != null && formData.ContainsKey("categoryIds_present")))
            {
                var ids = updateProductDto.CategoryIds ?? new List<int>();
                var selectedCategories = await context.Categories
                    .Where(c => ids.Contains(c.Id))
                    .ToListAsync();

                product.Categories ??= new List<Category>();
                product.Categories.Clear();
                foreach (var c in selectedCategories)
                {
                    product.Categories.Add(c);
                }
            }

            try
            {
                var result = await context.SaveChangesAsync() > 0;
                if (result) return NoContent();
                return BadRequest(new { message = "Problem updating product" });
            }
            catch (DbUpdateException dbEx)
            {
                // surface DB error details to aid debugging
                var inner = dbEx.InnerException?.Message ?? dbEx.Message;
                return BadRequest(new { message = "Problem updating product", detail = inner });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id:int}")]
        public async Task<ActionResult> DeleteProduct(int id)
        {
            var product = await context.Products.FindAsync(id);

            if (product == null) return NotFound();

            if (!string.IsNullOrEmpty(product.PublicId))
                    await imageService.DeleteImageAsync(product.PublicId);

            // delete any secondary images from Cloudinary
            if (product.SecondaryImagePublicIds != null && product.SecondaryImagePublicIds.Any())
            {
                foreach (var pid in product.SecondaryImagePublicIds.ToList())
                {
                    try { await imageService.DeleteImageAsync(pid); } catch { }
                }
            }

            context.Products.Remove(product);

            var result = await context.SaveChangesAsync() > 0;

            if (result) return Ok();

            return BadRequest("Problem deleting the product");
        }
    }
}