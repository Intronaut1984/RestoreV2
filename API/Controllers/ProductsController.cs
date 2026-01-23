using API.Data;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.RequestHelpers;
using API.Services;
using AutoMapper;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    public class ProductsController(StoreContext context, IMapper mapper, 
        ImageService imageService) : BaseApiController
    {
        [HttpGet]
        public async Task<ActionResult<List<Product>>> GetProducts(
            [FromQuery] ProductParams productParams)
        {
            // Start with base query applying sort/search and simple scalar filters
            var query = context.Products
                .Sort(productParams.OrderBy)
                .Search(productParams.SearchTerm)
                .Filter(productParams.Generos, productParams.Anos, productParams.HasDiscount)
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

            // include navigation properties after all filtering to keep the EF translation simple
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

            return Ok(new { generos, anos, categories, campaigns });
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