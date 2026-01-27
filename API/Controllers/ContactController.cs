using API.Data;
using API.DTOs;
using API.Entities;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Data.SqlClient;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactController(StoreContext context, IMapper mapper, ILogger<ContactController> logger) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ContactDto>> GetContact()
    {
        try
        {
            var contact = await context.Contacts.FirstOrDefaultAsync();
            if (contact == null)
                return Ok(new ContactDto());

            return Ok(mapper.Map<ContactDto>(contact));
        }
        catch (Exception ex)
        {
            // In production, DB schema might not be migrated yet. Don't break the whole site.
            logger.LogError(ex, "Failed to load Contact from database");
            return Ok(new ContactDto());
        }
    }

    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> UpdateContact([FromBody] ContactDto dto)
    {
        try
        {
            var contact = await context.Contacts.FirstOrDefaultAsync();

            if (contact == null)
            {
                contact = new Contact();
                context.Contacts.Add(contact);
                await context.SaveChangesAsync();
                // Reload to get the generated Id
                contact = await context.Contacts.FirstOrDefaultAsync();
                if (contact == null)
                    return BadRequest("Failed to create contact");
            }

            // Manually map properties to avoid mapping the Id (primary key)
            contact.Email = dto.Email;
            contact.Phone = dto.Phone;
            contact.Address = dto.Address;
            contact.City = dto.City;
            contact.PostalCode = dto.PostalCode;
            contact.Country = dto.Country;
            contact.CompanyName = dto.CompanyName;
            contact.TaxId = dto.TaxId;
            contact.FacebookUrl = dto.FacebookUrl;
            contact.InstagramUrl = dto.InstagramUrl;
            contact.LinkedinUrl = dto.LinkedinUrl;
            contact.TwitterUrl = dto.TwitterUrl;
            contact.WhatsappNumber = dto.WhatsappNumber;
            contact.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();
            return Ok();
        }
        catch (SqlException ex)
        {
            logger.LogError(ex, "Failed to update Contact (SqlException)");

            var detail = ex.Message.Contains("Invalid object name", StringComparison.OrdinalIgnoreCase)
                ? "Database schema is missing required tables (e.g. Contacts). Apply EF Core migrations to the production database."
                : "Database error while updating contact.";

            return Problem(
                title: "Database error while updating contact",
                detail: detail,
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
        catch (DbUpdateException ex)
        {
            logger.LogError(ex, "Failed to update Contact (DbUpdateException)");
            return Problem(
                title: "Database error while updating contact",
                detail: "The database may be unavailable or not migrated yet.",
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    }
}
