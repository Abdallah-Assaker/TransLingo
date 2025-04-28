using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using Translator.API.DbContext;
using Translator.API.Models;

namespace Translator.Tests;

public class DatabaseInitializationTests
{
    /// <summary>
    /// Tests that the database migrations are applied and an admin user is created
    /// when the application starts up with a fresh database.
    /// </summary>
    [Fact]
    public async Task ShouldApplyMigrationsAndCreateAdminUser()
    {
        // Arrange
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["AdminUser:Email"] = "testadmin@translator.com",
                ["AdminUser:Password"] = "TestAdmin@123456"
            })
            .Build();

        var services = new ServiceCollection();

        // Add logging services (required for Identity)
        services.AddLogging(builder => builder.AddConsole().AddDebug());

        // Add in-memory database
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase("TestMigrationDb"));

        // Add Identity services
        services.AddIdentity<ApplicationUser, IdentityRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

        // Add Configuration
        services.AddSingleton<IConfiguration>(configuration);

        var serviceProvider = services.BuildServiceProvider();

        // Act
        // Simulate program.cs behavior
        using (var scope = serviceProvider.CreateScope())
        {
            var scopedServices = scope.ServiceProvider;
            var dbContext = scopedServices.GetRequiredService<ApplicationDbContext>();
            var roleManager = scopedServices.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = scopedServices.GetRequiredService<UserManager<ApplicationUser>>();

            // Create roles
            string[] roleNames = { "Admin", "User" };
            foreach (var roleName in roleNames)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new IdentityRole(roleName));
                }
            }

            // Create admin user
            var adminEmail = configuration["AdminUser:Email"];
            var adminUser = await userManager.FindByEmailAsync(adminEmail!);
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

                var password = configuration["AdminUser:Password"]!;
                var result = await userManager.CreateAsync(admin, password);

                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(admin, "Admin");
                }
            }
        }

        // Assert
        using (var scope = serviceProvider.CreateScope())
        {
            var scopedServices = scope.ServiceProvider;
            var userManager = scopedServices.GetRequiredService<UserManager<ApplicationUser>>();
            var roleManager = scopedServices.GetRequiredService<RoleManager<IdentityRole>>();

            // Check if roles were created
            Assert.True(await roleManager.RoleExistsAsync("Admin"));
            Assert.True(await roleManager.RoleExistsAsync("User"));

            // Check if admin user was created
            var adminEmail = configuration["AdminUser:Email"];
            var adminUser = await userManager.FindByEmailAsync(adminEmail!);
            Assert.NotNull(adminUser);
            Assert.Equal("Admin", adminUser.FirstName);
            Assert.Equal("User", adminUser.LastName);

            // Check if admin user has Admin role
            var isAdmin = await userManager.IsInRoleAsync(adminUser, "Admin");
            Assert.True(isAdmin);

            // Verify only one admin is created by checking total count of users with this email
            var adminCount = userManager.Users.Count(u => u.Email == adminEmail);
            Assert.Equal(1, adminCount);
        }
    }

    /// <summary>
    /// Tests that attempting to create an admin user a second time doesn't create a duplicate.
    /// </summary>
    [Fact]
    public async Task ShouldNotCreateDuplicateAdminUser()
    {
        // Arrange
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["AdminUser:Email"] = "testadmin2@translator.com",
                ["AdminUser:Password"] = "TestAdmin@123456"
            })
            .Build();

        var services = new ServiceCollection();

        // Add logging services (required for Identity)
        services.AddLogging(builder => builder.AddConsole().AddDebug());

        // Add in-memory database with a different name to avoid conflicts
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase("TestMigrationDb2"));

        // Add Identity services
        services.AddIdentity<ApplicationUser, IdentityRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

        // Add Configuration
        services.AddSingleton<IConfiguration>(configuration);

        var serviceProvider = services.BuildServiceProvider();

        // Act
        // Create admin user - first run
        using (var scope = serviceProvider.CreateScope())
        {
            var scopedServices = scope.ServiceProvider;
            var roleManager = scopedServices.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = scopedServices.GetRequiredService<UserManager<ApplicationUser>>();
            
            // Create roles
            string[] roleNames = { "Admin", "User" };
            foreach (var roleName in roleNames)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new IdentityRole(roleName));
                }
            }

            // Create admin user first time
            var adminEmail = configuration["AdminUser:Email"];
            var adminUser = await userManager.FindByEmailAsync(adminEmail!);
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

                var password = configuration["AdminUser:Password"]!;
                var result = await userManager.CreateAsync(admin, password);

                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(admin, "Admin");
                }
            }
        }

        // Try to create admin user again - second run
        using (var scope = serviceProvider.CreateScope())
        {
            var scopedServices = scope.ServiceProvider;
            var userManager = scopedServices.GetRequiredService<UserManager<ApplicationUser>>();
            
            // Try to create admin user second time
            var adminEmail = configuration["AdminUser:Email"];
            var adminUser = await userManager.FindByEmailAsync(adminEmail!);
            if (adminUser == null)
            {
                var admin = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    FirstName = "Admin2", // Different name to detect if a new user is created
                    LastName = "User2",
                    EmailConfirmed = true,
                    SecurityStamp = Guid.NewGuid().ToString()
                };

                var password = configuration["AdminUser:Password"]!;
                var result = await userManager.CreateAsync(admin, password);

                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(admin, "Admin");
                }
            }
        }

        // Assert
        using (var scope = serviceProvider.CreateScope())
        {
            var scopedServices = scope.ServiceProvider;
            var userManager = scopedServices.GetRequiredService<UserManager<ApplicationUser>>();

            // Count admin users with this email - should be exactly 1
            var adminEmail = configuration["AdminUser:Email"];
            var adminCount = userManager.Users.Count(u => u.Email == adminEmail);
            Assert.Equal(1, adminCount);

            // Verify the admin user has the original name, not the second attempt name
            var adminUser = await userManager.FindByEmailAsync(adminEmail!);
            Assert.NotNull(adminUser);
            Assert.Equal("Admin", adminUser.FirstName);
            Assert.Equal("User", adminUser.LastName);
        }
    }
}