using System;
using API.DTOs;
using API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

public class AccountController(SignInManager<User> signInManager) : BaseApiController
{
    [HttpPost("register")]
    public async Task<ActionResult> RegisterUser(RegisterDto registerDto)
    {
        var user = new User{UserName = registerDto.Email, Email = registerDto.Email};

        var result = await signInManager.UserManager.CreateAsync(user, registerDto.Password);

        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(error.Code, error.Description);
            }

            return ValidationProblem();
        }

        await signInManager.UserManager.AddToRoleAsync(user, "Member");

        return Ok();
    }

    [HttpGet("user-info")]
    public async Task<ActionResult> GetUserInfo()
    {
        if (User.Identity?.IsAuthenticated == false) return NoContent();

        var user = await signInManager.UserManager.GetUserAsync(User);

        if (user == null) return Unauthorized();

        var roles = await signInManager.UserManager.GetRolesAsync(user);

        return Ok(new 
        {
            user.Email,
            user.UserName,
            Roles = roles
        });
    }

    [HttpPost("logout")]
    public async Task<ActionResult> Logout()
    {
        await signInManager.SignOutAsync();

        return NoContent();
    }

    [Authorize]
    [HttpPost("address")]
    public async Task<ActionResult<Address>> CreateOrUpdateAddress(Address address)
    {
        var user = await signInManager.UserManager.Users
            .Include(x => x.Address)
            .FirstOrDefaultAsync(x => x.UserName == User.Identity!.Name);

        if (user == null) return Unauthorized();

        user.Address = address;

        var result = await signInManager.UserManager.UpdateAsync(user);

        if (!result.Succeeded) return BadRequest("Problem updating user address");

        return Ok(user.Address);
    }

    [Authorize]
    [HttpGet("address")]
    public async Task<ActionResult<Address>> GetSavedAddress()
    {
        var address = await signInManager.UserManager.Users
            .Where(x => x.UserName == User.Identity!.Name)
            .Select(x => x.Address)
            .FirstOrDefaultAsync();

        if (address == null) return NoContent();

        return address;
    }

    [Authorize]
    [HttpPut("user-info")]
    public async Task<ActionResult> UpdateUserInfo(UpdateUserDto update)
    {
        var user = await signInManager.UserManager.GetUserAsync(User);

        if (user == null) return Unauthorized();

        // If email is changing, ensure it's not already taken and update via UserManager
        if (!string.IsNullOrWhiteSpace(update.Email) && update.Email != user.Email)
        {
            var existing = await signInManager.UserManager.FindByEmailAsync(update.Email);
            if (existing != null && existing.Id != user.Id)
            {
                return BadRequest("Email is already in use");
            }

            var setEmailResult = await signInManager.UserManager.SetEmailAsync(user, update.Email);
            if (!setEmailResult.Succeeded)
            {
                return BadRequest("Problem updating email");
            }
        }

        // If username is changing, ensure it's not already taken and update via UserManager
        if (!string.IsNullOrWhiteSpace(update.UserName) && update.UserName != user.UserName)
        {
            var existingUser = await signInManager.UserManager.FindByNameAsync(update.UserName);
            if (existingUser != null && existingUser.Id != user.Id)
            {
                return BadRequest("Username is already in use");
            }

            var setUserNameResult = await signInManager.UserManager.SetUserNameAsync(user, update.UserName);
            if (!setUserNameResult.Succeeded)
            {
                return BadRequest("Problem updating username");
            }
        }

        // Ensure other user fields are persisted
        var result = await signInManager.UserManager.UpdateAsync(user);

        if (!result.Succeeded) return BadRequest("Problem updating user");

        var roles = await signInManager.UserManager.GetRolesAsync(user);

        return Ok(new
        {
            user.Email,
            user.UserName,
            Roles = roles
        });
    }

    [HttpPost("login")]
    public async Task<ActionResult> Login(LoginDto login)
    {
        if (login == null) return BadRequest("Invalid login request");

        string? userName = null;

        // try find by email first
        if (!string.IsNullOrWhiteSpace(login.Identifier) && login.Identifier.Contains('@'))
        {
            var byEmail = await signInManager.UserManager.FindByEmailAsync(login.Identifier);
            if (byEmail != null) userName = byEmail.UserName;
        }

        // if not found by email, try as username
        if (userName == null)
        {
            var byName = await signInManager.UserManager.FindByNameAsync(login.Identifier);
            if (byName != null) userName = byName.UserName;
        }

        if (userName == null)
            return Unauthorized();

        var result = await signInManager.PasswordSignInAsync(userName, login.Password, isPersistent: false, lockoutOnFailure: false);

        if (!result.Succeeded) return Unauthorized();

        return Ok();
    }
}