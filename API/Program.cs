using API.Data;
using System.Text.Json.Serialization;
using API.Entities;
using API.Middleware;
using API.RequestHelpers;
using API.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddScoped<IEmailService, SendGridEmailService>();
builder.Services.Configure<CloudinarySettings>(builder.Configuration.GetSection("Cloudinary"));
builder.Services.AddControllers().AddJsonOptions(opt =>
{
    // serialize enums as their string names so frontend receives readable genero values
    opt.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    // prevent reference-cycle serialization errors when entities have back-references
    opt.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});
builder.Services.AddDbContext<StoreContext>(opt => 
{
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});
builder.Services.AddCors();
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
builder.Services.AddTransient<ExceptionMiddleware>();
builder.Services.AddScoped<PaymentsService>();
builder.Services.AddScoped<ImageService>();
builder.Services.AddScoped<DiscountService>();
builder.Services.AddIdentityApiEndpoints<User>(opt =>
{
    opt.User.RequireUniqueEmail = true;
})
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<StoreContext>();

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseMiddleware<ExceptionMiddleware>();

app.UseDefaultFiles();
app.UseStaticFiles();

// Add COOP header to allow Google popup communication
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    await next();
});

app.UseCors(opt => 
{
    var origins = new[] 
    { 
        "https://localhost:3000",
        "https://restore-course-alumn.azurewebsites.net"
    };
    
    opt.AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()
        .WithOrigins(origins);
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGroup("api").MapIdentityApi<User>(); // api/login
app.MapFallbackToController("Index", "Fallback");

// Skip database initialization on startup for now - causes 500 errors
// We'll handle migrations manually or through a separate endpoint
// try
// {
//     await DbInitializer.InitDb(app);
// }
// catch (Exception ex)
// {
//     Console.WriteLine($"[ERROR] DB Init failed: {ex.Message}");
// }

app.Run();