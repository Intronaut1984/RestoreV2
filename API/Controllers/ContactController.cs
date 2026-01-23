using API.Data;
using API.DTOs;
using API.Entities;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContactController(StoreContext context, IMapper mapper) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ContactDto>> GetContact()
    {
        var contact = await context.Contacts.FirstOrDefaultAsync();
        if (contact == null)
            return Ok(new ContactDto());
        
        return Ok(mapper.Map<ContactDto>(contact));
    }

    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> UpdateContact([FromBody] ContactDto dto)
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
}
