using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class DbInitializer
{
    public static async Task InitDb(WebApplication app)
    {
        using var scope = app.Services.CreateScope();

        var context = scope.ServiceProvider.GetRequiredService<StoreContext>()
            ?? throw new InvalidOperationException("Failed to retrieve store context");
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>()
            ?? throw new InvalidOperationException("Failed to retrieve user manager");

        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>()
            ?? throw new InvalidOperationException("Failed to retrieve role manager");

        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        await SeedData(app, config, context, userManager, roleManager);
    }

    private static async Task SeedData(WebApplication app, IConfiguration config, StoreContext context, UserManager<User> userManager, RoleManager<IdentityRole> roleManager)
    {
        try
        {
            Console.WriteLine("[DB] Starting database migration...");
            await context.Database.MigrateAsync();
            Console.WriteLine("[DB] Migration completed successfully");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DB ERROR] Migration failed: {ex.Message}");
            Console.WriteLine($"[DB ERROR] Stack trace: {ex.StackTrace}");
            throw;
        }

        try
        {
            // Ensure roles exist before assigning them.
            await EnsureRole(roleManager, "Member");
            await EnsureRole(roleManager, "Admin");

            // Ensure there's always at least one admin in Production.
            // Configure via App Service settings:
            // - AdminSettings__Email (recommended) or ADMIN_EMAIL
            // - AdminSettings__Password (optional) or ADMIN_PASSWORD
            var adminEmail =
                config["AdminSettings:Email"]
                ?? config["ADMIN_EMAIL"];

            var adminPassword =
                config["AdminSettings:Password"]
                ?? config["ADMIN_PASSWORD"];

            if (!string.IsNullOrWhiteSpace(adminEmail))
            {
                var existingAdmin = await userManager.FindByEmailAsync(adminEmail);
                if (existingAdmin == null)
                {
                    Console.WriteLine($"[DB] Creating configured admin user: {adminEmail}");
                    existingAdmin = new User { UserName = adminEmail, Email = adminEmail };

                    IdentityResult createResult;
                    if (!string.IsNullOrWhiteSpace(adminPassword))
                    {
                        createResult = await userManager.CreateAsync(existingAdmin, adminPassword);
                    }
                    else
                    {
                        // No password required if you only plan to sign-in via Google.
                        createResult = await userManager.CreateAsync(existingAdmin);
                    }

                    if (!createResult.Succeeded)
                    {
                        var msg = string.Join("; ", createResult.Errors.Select(e => e.Description));
                        throw new InvalidOperationException($"Failed to create configured admin user: {msg}");
                    }
                }

                // Ensure roles
                var currentRoles = await userManager.GetRolesAsync(existingAdmin);
                var desiredRoles = new List<string> { "Member", "Admin" };
                var missing = desiredRoles.Where(r => !currentRoles.Contains(r)).ToArray();
                if (missing.Length > 0)
                {
                    var roleResult = await userManager.AddToRolesAsync(existingAdmin, missing);
                    if (!roleResult.Succeeded)
                    {
                        var msg = string.Join("; ", roleResult.Errors.Select(e => e.Description));
                        throw new InvalidOperationException($"Failed to add roles to admin user: {msg}");
                    }
                }
            }
            else if (app.Environment.IsDevelopment() && !userManager.Users.Any())
            {
                // Dev convenience accounts
                Console.WriteLine("[DB] Creating default dev users...");

                var user = new User { UserName = "bob@test.com", Email = "bob@test.com" };
                await userManager.CreateAsync(user, "Pa$$w0rd");
                await userManager.AddToRoleAsync(user, "Member");

                var admin = new User { UserName = "admin@test.com", Email = "admin@test.com" };
                await userManager.CreateAsync(admin, "Pa$$w0rd");
                await userManager.AddToRolesAsync(admin, new[] { "Member", "Admin" });

                Console.WriteLine("[DB] Default dev users created");
            }

            // Ensure every existing user has at least Member role (important for Google-register users).
            // This is a safe best-effort operation.
            foreach (var u in userManager.Users.ToList())
            {
                var roles = await userManager.GetRolesAsync(u);
                if (!roles.Contains("Member"))
                {
                    await userManager.AddToRoleAsync(u, "Member");
                }
            }

            if (context.Products.Any())
            {
                Console.WriteLine("[DB] Products already exist, skipping seeding");
                return;
            }

            var products = new List<Product>
            {
                new() {
                    Name = "Angular Speedster Board 2000",
                    Synopsis = "Lorem ipsum dolor sit amet, consectetuer adipiscing elit.",
                    Price = 200.00M,
                    PictureUrl = "/images/products/sb-ang1.png",
                    QuantityInStock = 100
                },
                new() {
                    Name = "Green Angular Board 3000",
                    Synopsis = "Nunc viverra imperdiet enim. Fusce est.",
                    Price = 150.00M,
                    PictureUrl = "/images/products/sb-ang2.png",
                    QuantityInStock = 100
                },
                new() {
                    Name = "Core Board Speed Rush 3",
                    Synopsis = "Suspendisse dui purus, scelerisque at, vulputate vitae.",
                    Price = 180.00M,
                    PictureUrl = "/images/products/sb-core1.png",
                    QuantityInStock = 100
                },
                new() {
                    Name = "Net Core Super Board",
                    Synopsis = "Pellentesque habitant morbi tristique senectus et netus.",
                    Price = 300.00M,
                    PictureUrl = "/images/products/sb-core2.png",
                    QuantityInStock = 100
                },
                new() {
                    Name = "React Board Super Whizzy Fast",
                    Synopsis = "Lorem ipsum dolor sit amet, consectetuer adipiscing elit.",
                    Price = 250.00M,
                    PictureUrl = "/images/products/sb-react1.png",
                    QuantityInStock = 100
                },
                new() {
                    Name = "Typescript Entry Board",
                    Synopsis = "Lorem ipsum dolor sit amet, consectetuer adipiscing elit.",
                    Price = 120.00M,
                    PictureUrl = "/images/products/sb-ts1.png",
                    QuantityInStock = 100
                }
            };

            context.Products.AddRange(products);
            await context.SaveChangesAsync();
            Console.WriteLine("[DB] Products seeded successfully");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DB ERROR] Seeding error: {ex.Message}");
            throw;
        }
    }

    private static async Task EnsureRole(RoleManager<IdentityRole> roleManager, string roleName)
    {
        if (await roleManager.RoleExistsAsync(roleName)) return;
        var result = await roleManager.CreateAsync(new IdentityRole(roleName));
        if (!result.Succeeded)
        {
            var msg = string.Join("; ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to create role '{roleName}': {msg}");
        }
    }
}
