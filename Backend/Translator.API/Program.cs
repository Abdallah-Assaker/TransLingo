using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Translator.API.DbContext;
using Translator.API.Models;
using Translator.API.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS to allow all origins
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Configure Entity Framework Context
// Use SQL Server for production
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequiredLength = 6;
    options.Password.RequireDigit = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedEmail = false;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Configure Authentication with JWT
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false;
    options.TokenValidationParameters = new TokenValidationParameters()
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidAudience = builder.Configuration["JWT:ValidAudience"],
        ValidIssuer = builder.Configuration["JWT:ValidIssuer"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            builder.Configuration["JWT:Secret"] ?? "fallbackSecretKey1234567890123456789012"))
    };
});

// Register application services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITranslationRequestService, TranslationRequestService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Removed app.UseHttpsRedirection() to disable HTTPS requirement

// Enable CORS
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Apply migrations, create upload directory, create default roles and admin user on application startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        // Apply pending migrations
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        Console.WriteLine("Applying database migrations...");
        dbContext.Database.Migrate();
        Console.WriteLine("Database migrations applied successfully");
        
        // Create upload directory
        var uploadPath = builder.Configuration["FileStorage:UploadPath"] ?? 
                         Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
        
        if (!Directory.Exists(uploadPath))
        {
            Console.WriteLine($"Creating upload directory: {uploadPath}");
            Directory.CreateDirectory(uploadPath);
            Console.WriteLine("Upload directory created successfully");
        }
        else
        {
            Console.WriteLine("Upload directory already exists");
        }
        
        // Get services for role and user management
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        
        // Create roles if they don't exist
        Console.WriteLine("Creating default roles...");
        string[] roleNames = { "Admin", "User" };
        foreach (var roleName in roleNames)
        {
            var roleExists = roleManager.RoleExistsAsync(roleName).GetAwaiter().GetResult();
            if (!roleExists)
            {
                roleManager.CreateAsync(new IdentityRole(roleName)).GetAwaiter().GetResult();
                Console.WriteLine($"Role created: {roleName}");
            }
            else
            {
                Console.WriteLine($"Role already exists: {roleName}");
            }
        }
        
        // Create admin user if it doesn't exist
        Console.WriteLine("Checking for admin user...");
        var adminEmail = builder.Configuration["AdminUser:Email"] ?? "admin@translator.com";
        var adminUser = userManager.FindByEmailAsync(adminEmail).GetAwaiter().GetResult();
        if (adminUser == null)
        {
            var admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FirstName = "Admin",
                LastName = "User",
                EmailConfirmed = true,
                SecurityStamp = Guid.NewGuid().ToString()
            };
            
            var password = builder.Configuration["AdminUser:Password"] ?? "Admin@123456";
            var result = userManager.CreateAsync(admin, password).GetAwaiter().GetResult();
            
            if (result.Succeeded)
            {
                userManager.AddToRoleAsync(admin, "Admin").GetAwaiter().GetResult();
                Console.WriteLine($"Admin user created successfully: {adminEmail}");
            }
            else
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                Console.WriteLine($"Failed to create admin user: {errors}");
            }
        }
        else
        {
            Console.WriteLine($"Admin user already exists: {adminEmail}");
        }
        
        Console.WriteLine("Database initialization completed successfully");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"An error occurred during application initialization: {ex.Message}");
        // In a production environment, you might want to log this to a file
    }
}

app.Run();
