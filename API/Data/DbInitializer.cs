using System;
using System.Threading.Tasks;
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

        await SeedData(context, userManager);
    }

    private static async Task SeedData(StoreContext context, UserManager<User> userManager)
    {
        context.Database.Migrate();

        if (!userManager.Users.Any())
        {
            var user = new User
            {
                UserName = "bob@test.com",
                Email = "bob@test.com"
            };

            await userManager.CreateAsync(user, "Pa$$w0rd");
            await userManager.AddToRoleAsync(user, "Member");

            var admin = new User
            {
                UserName = "admin@test.com",
                Email = "admin@test.com"
            };

            await userManager.CreateAsync(admin, "Pa$$w0rd");
            await userManager.AddToRolesAsync(admin, ["Member", "Admin"]);
        }

        if (context.Products.Any()) return;

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

        context.SaveChanges();
    }
}
