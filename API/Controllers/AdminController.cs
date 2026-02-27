using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using API.DTOs;
using API.Entities;
using API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize(Roles = "Admin")]
public class AdminController(UserManager<User> userManager) : BaseApiController
{
    [HttpGet("users")]
    public async Task<ActionResult<List<AdminUserDto>>> GetUsers()
    {
        var users = userManager.Users.ToList();

        var result = new List<AdminUserDto>();

        foreach (var u in users)
        {
            var roles = await userManager.GetRolesAsync(u);
            result.Add(new AdminUserDto
            {
                Email = u.Email ?? string.Empty,
                UserName = u.UserName,
                Roles = roles
            });
        }

        return Ok(result);
    }

    [HttpPut("users/roles")]
    public async Task<ActionResult> UpdateUserRole(UpdateUserRoleDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Role))
            return BadRequest("Invalid request");

        var user = await userManager.FindByEmailAsync(dto.Email);

        if (user == null) return NotFound("User not found");

        var isAdmin = (await userManager.GetRolesAsync(user)).Contains("Admin");

        // If requested role is Admin and user isn't admin, add Admin role
        if (dto.Role == "Admin" && !isAdmin)
        {
            var addResult = await userManager.AddToRoleAsync(user, "Admin");
            if (!addResult.Succeeded) return BadRequest("Failed to add role");
            return NoContent();
        }

        // If requested role is Member (i.e. remove admin) and user is admin, remove Admin
        if (dto.Role == "Member" && isAdmin)
        {
            var removeResult = await userManager.RemoveFromRoleAsync(user, "Admin");
            if (!removeResult.Succeeded) return BadRequest("Failed to remove role");
            return NoContent();
        }

        // Nothing to change
        return NoContent();
    }

    [HttpPost("users/delete")]
    public async Task<IActionResult> DeleteUser([FromBody] DeleteUserDto dto, [FromServices] AccountDeletionService deletionService, CancellationToken ct)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Email)) return BadRequest("Invalid request");

        var email = dto.Email.Trim();
        var user = await userManager.FindByEmailAsync(email);
        if (user == null) return NotFound("User not found");

        var roles = await userManager.GetRolesAsync(user);
        if (roles.Contains("Admin"))
        {
            var admins = await userManager.GetUsersInRoleAsync("Admin");
            if (admins.Count <= 1)
            {
                return BadRequest("Não é possível apagar o último admin");
            }
        }

        var (ok, error) = await deletionService.DeleteUserAsync(user, dto.DeleteStoredData, ct);
        if (!ok) return BadRequest(error ?? "Problem deleting user");

        return NoContent();
    }

    [HttpGet("promo")]
    public ActionResult<PromoDto> GetPromo([FromServices] API.Data.StoreContext context)
    {
        // return first promo row or defaults
        var promo = context.Promos.FirstOrDefault();
        if (promo == null)
        {
            return Ok(new PromoDto { Message = "Entrega grátis em compras acima de €50 — Aproveite!", Color = "#050505" });
        }

        return Ok(new PromoDto { Message = promo.Message, Color = promo.Color });
    }

    [HttpPut("promo")]
    public async Task<ActionResult> UpdatePromo([FromBody] PromoDto dto, [FromServices] API.Data.StoreContext context)
    {
        if (dto == null) return BadRequest("Invalid payload");

        var promo = context.Promos.FirstOrDefault();
        if (promo == null)
        {
            promo = new Promo { Message = dto.Message ?? string.Empty, Color = dto.Color ?? "#050505" };
            context.Promos.Add(promo);
        }
        else
        {
            promo.Message = dto.Message ?? string.Empty;
            promo.Color = dto.Color ?? "#050505";
            context.Promos.Update(promo);
        }

        await context.SaveChangesAsync();

        return NoContent();
    }
}
