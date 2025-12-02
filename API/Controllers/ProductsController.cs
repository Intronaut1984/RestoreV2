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
            var query = context.Products
                .Sort(productParams.OrderBy)
                .Search(productParams.SearchTerm)
                .Filter(productParams.Generos, productParams.Anos)
                .AsQueryable();

            var products = await PagedList<Product>.ToPagedList(query,
                productParams.PageNumber, productParams.PageSize);

            Response.AddPaginationHeader(products.Metadata);

            return products;
        }

        [HttpGet("{id}")] // api/products/2
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            var product = await context.Products.FindAsync(id);

            if (product == null) return NotFound();

            return product;
        }

        [HttpGet("filters")]
        public async Task<IActionResult> GetFilters()
        {
            // return distinct generos and publication years available for filters
            var generos = await context.Products
                .Where(p => p.Genero != null)
                .Select(p => p.Genero.ToString())
                .Distinct()
                .ToListAsync();

            var anos = await context.Products
                .Where(p => p.PublicationYear.HasValue)
                .Select(p => p.PublicationYear!.Value)
                .Distinct()
                .OrderByDescending(x => x)
                .ToListAsync();

            return Ok(new { generos, anos });
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
                product.SecondaryImages = product.SecondaryImages ?? new List<string>();
                product.SecondaryImagePublicIds = product.SecondaryImagePublicIds ?? new List<string>();
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
            if (Request.HasFormContentType)
            {
                var form = await Request.ReadFormAsync();
                if (form.TryGetValue("anoPublicacao", out var yearValues))
                {
                    if (int.TryParse(yearValues.FirstOrDefault(), out var year))
                    {
                        product.PublicationYear = year;
                    }
                }
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
            var product = await context.Products.FindAsync(updateProductDto.Id);

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
                product.SecondaryImages = product.SecondaryImages ?? new List<string>();
                product.SecondaryImagePublicIds = product.SecondaryImagePublicIds ?? new List<string>();
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
                    if (product.SecondaryImagePublicIds.Contains(identifier))
                    {
                        try
                        {
                            await imageService.DeleteImageAsync(identifier);
                        }
                        catch { /* swallow deletion errors, proceed to remove from lists */ }

                        var idx = product.SecondaryImagePublicIds.IndexOf(identifier);
                        if (idx >= 0 && idx < product.SecondaryImages.Count)
                        {
                            product.SecondaryImages.RemoveAt(idx);
                        }
                        product.SecondaryImagePublicIds.Remove(identifier);
                    }
                    else
                    {
                        // treat identifier as URL - remove URL and any matching publicId at same index
                        if (product.SecondaryImages.Contains(identifier))
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
            if (Request.HasFormContentType)
            {
                var form = await Request.ReadFormAsync();
                if (form.TryGetValue("anoPublicacao", out var yearValues))
                {
                    if (int.TryParse(yearValues.FirstOrDefault(), out var year))
                    {
                        product.PublicationYear = year;
                    }
                }
            }

            var result = await context.SaveChangesAsync() > 0;

            if (result) return NoContent();

            return BadRequest(new { message = "Problem updating product" });
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