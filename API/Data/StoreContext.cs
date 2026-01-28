using System;
using API.Entities;
using API.Entities.OrderAggregate;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class StoreContext(DbContextOptions options) : IdentityDbContext<User>(options)
{
    public required DbSet<Product> Products { get; set; }
    public required DbSet<ProductClick> ProductClicks { get; set; }
    public required DbSet<Favorite> Favorites { get; set; }
    public required DbSet<Campaign> Campaigns { get; set; }
    public required DbSet<Category> Categories { get; set; }
    public required DbSet<Basket> Baskets { get; set; }
    public required DbSet<Order> Orders { get; set; }
    public required DbSet<Promo> Promos { get; set; }
    public required DbSet<Logo> Logos { get; set; }
    public required DbSet<Contact> Contacts { get; set; }
    public required DbSet<ShippingRate> ShippingRates { get; set; }
    public required DbSet<HeroBlock> HeroBlocks { get; set; }
    public required DbSet<HeroBlockImage> HeroBlockImages { get; set; }
    public required DbSet<Newsletter> Newsletters { get; set; }
    public required DbSet<NewsletterAttachment> NewsletterAttachments { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<User>()
            .Property(u => u.NewsletterOptIn)
            .HasDefaultValue(true);

        builder.Entity<Newsletter>()
            .HasMany(n => n.Attachments)
            .WithOne(a => a.Newsletter)
            .HasForeignKey(a => a.NewsletterId)
            .OnDelete(DeleteBehavior.Cascade);

        // Avoid implicit decimal precision/scale defaults on SQL Server (prevents truncation + removes EF warnings)
        builder.Entity<Product>()
            .Property(p => p.Price)
            .HasPrecision(18, 2);

        builder.Entity<Product>()
            .Property(p => p.PromotionalPrice)
            .HasPrecision(18, 2);

        builder.Entity<ShippingRate>()
            .Property(p => p.Rate)
            .HasPrecision(18, 2);

        builder.Entity<ShippingRate>()
            .Property(p => p.FreeShippingThreshold)
            .HasPrecision(18, 2);

        builder.Entity<IdentityRole>()
            .HasData(
                new IdentityRole {Id = "e069461a-10cf-4abf-9930-d070b2a7e40f", Name = "Member", NormalizedName = "MEMBER"},
                new IdentityRole {Id = "ed2e9149-fa53-484c-a93f-bd33f9e9fcf6", Name = "Admin", NormalizedName = "ADMIN"}
            );
    }
}
