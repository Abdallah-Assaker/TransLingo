using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Moq;
using System.Collections.Generic;
using System.Threading.Tasks;
using Translator.API.Models;
using Translator.API.Services;
using Xunit;

namespace Translator.Tests
{
    public class AuthServiceTests
    {
        private readonly Mock<UserManager<ApplicationUser>> _mockUserManager;
        private readonly Mock<SignInManager<ApplicationUser>> _mockSignInManager;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly AuthService _authService;

        public AuthServiceTests()
        {
            // Setup UserManager mock
            var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
            _mockUserManager = new Mock<UserManager<ApplicationUser>>(
                userStoreMock.Object, null, null, null, null, null, null, null, null);

            // Setup SignInManager mock (requires IHttpContextAccessor and IUserClaimsPrincipalFactory)
            var contextAccessorMock = new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
            var userPrincipalFactoryMock = new Mock<IUserClaimsPrincipalFactory<ApplicationUser>>();
            _mockSignInManager = new Mock<SignInManager<ApplicationUser>>(
                _mockUserManager.Object, contextAccessorMock.Object, userPrincipalFactoryMock.Object, null, null, null, null);

            // Setup Configuration mock
            _mockConfiguration = new Mock<IConfiguration>();
            var configurationSectionMock = new Mock<IConfigurationSection>();
            configurationSectionMock.Setup(x => x.Value).Returns("TestSecretKey12345678901234567890123456789012");
            _mockConfiguration.Setup(x => x["JWT:Secret"]).Returns("TestSecretKey12345678901234567890123456789012");
            _mockConfiguration.Setup(x => x["JWT:ValidIssuer"]).Returns("TestIssuer");
            _mockConfiguration.Setup(x => x["JWT:ValidAudience"]).Returns("TestAudience");
            _mockConfiguration.Setup(x => x["JWT:TokenValidityInHours"]).Returns("1");

            // Create AuthService instance with mocked dependencies
            _authService = new AuthService(_mockUserManager.Object, _mockSignInManager.Object, _mockConfiguration.Object);
        }

        [Fact]
        public async Task RegisterAsync_WithValidModel_ShouldReturnSuccess()
        {
            // Arrange
            var registerModel = new RegisterModel
            {
                FirstName = "Test",
                LastName = "User",
                Email = "test@example.com",
                Password = "Password123!",
                ConfirmPassword = "Password123!"
            };

            _mockUserManager.Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
                .ReturnsAsync((ApplicationUser)null);

            _mockUserManager.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
                .ReturnsAsync(IdentityResult.Success);

            _mockUserManager.Setup(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _authService.RegisterAsync(registerModel);

            // Assert
            Assert.True(result.Success);
            Assert.Equal("User created successfully!", result.Message);
            Assert.NotNull(result.User);
            
            // Verify methods were called
            _mockUserManager.Verify(x => x.FindByEmailAsync(It.IsAny<string>()), Times.Once);
            _mockUserManager.Verify(x => x.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()), Times.Once);
            _mockUserManager.Verify(x => x.AddToRoleAsync(It.IsAny<ApplicationUser>(), "User"), Times.Once);
        }

        [Fact]
        public async Task RegisterAsync_WithExistingEmail_ShouldReturnFailure()
        {
            // Arrange
            var registerModel = new RegisterModel
            {
                FirstName = "Test",
                LastName = "User",
                Email = "existing@example.com",
                Password = "Password123!",
                ConfirmPassword = "Password123!"
            };

            var existingUser = new ApplicationUser
            {
                Email = "existing@example.com",
                UserName = "existing@example.com"
            };

            _mockUserManager.Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
                .ReturnsAsync(existingUser);

            // Act
            var result = await _authService.RegisterAsync(registerModel);

            // Assert
            Assert.False(result.Success);
            Assert.Equal("User already exists!", result.Message);
            Assert.Null(result.User);
            
            // Verify methods were called
            _mockUserManager.Verify(x => x.FindByEmailAsync(It.IsAny<string>()), Times.Once);
            _mockUserManager.Verify(x => x.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task LoginAsync_WithValidCredentials_ShouldReturnSuccess()
        {
            // Arrange
            var loginModel = new LoginModel
            {
                Email = "test@example.com",
                Password = "Password123!"
            };

            var user = new ApplicationUser
            {
                Id = "user123",
                Email = "test@example.com",
                UserName = "test@example.com"
            };

            _mockUserManager.Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
                .ReturnsAsync(user);

            _mockSignInManager.Setup(x => x.CheckPasswordSignInAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>(), It.IsAny<bool>()))
                .ReturnsAsync(SignInResult.Success);

            _mockUserManager.Setup(x => x.GetRolesAsync(It.IsAny<ApplicationUser>()))
                .ReturnsAsync(new List<string> { "User" });

            // Act
            var result = await _authService.LoginAsync(loginModel);

            // Assert
            Assert.True(result.Success);
            Assert.Equal("Login successful.", result.Message);
            Assert.NotNull(result.Response);
            Assert.Equal(user.Id, result.Response.UserId);
            Assert.Equal(user.Email, result.Response.Email);
            Assert.Contains("User", result.Response.Roles);
            Assert.NotEmpty(result.Response.Token);
            
            // Verify methods were called
            _mockUserManager.Verify(x => x.FindByEmailAsync(It.IsAny<string>()), Times.Once);
            _mockSignInManager.Verify(x => x.CheckPasswordSignInAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>(), It.IsAny<bool>()), Times.Once);
            _mockUserManager.Verify(x => x.GetRolesAsync(It.IsAny<ApplicationUser>()), Times.Once);
        }

        [Fact]
        public async Task LoginAsync_WithInvalidUser_ShouldReturnFailure()
        {
            // Arrange
            var loginModel = new LoginModel
            {
                Email = "nonexistent@example.com",
                Password = "Password123!"
            };

            _mockUserManager.Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
                .ReturnsAsync((ApplicationUser)null);

            // Act
            var result = await _authService.LoginAsync(loginModel);

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Invalid credentials.", result.Message);
            Assert.Null(result.Response);
            
            // Verify methods were called
            _mockUserManager.Verify(x => x.FindByEmailAsync(It.IsAny<string>()), Times.Once);
            _mockSignInManager.Verify(x => x.CheckPasswordSignInAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>(), It.IsAny<bool>()), Times.Never);
        }

        [Fact]
        public async Task LoginAsync_WithInvalidPassword_ShouldReturnFailure()
        {
            // Arrange
            var loginModel = new LoginModel
            {
                Email = "test@example.com",
                Password = "WrongPassword123!"
            };

            var user = new ApplicationUser
            {
                Email = "test@example.com",
                UserName = "test@example.com"
            };

            _mockUserManager.Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
                .ReturnsAsync(user);

            _mockSignInManager.Setup(x => x.CheckPasswordSignInAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>(), It.IsAny<bool>()))
                .ReturnsAsync(SignInResult.Failed);

            // Act
            var result = await _authService.LoginAsync(loginModel);

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Invalid credentials.", result.Message);
            Assert.Null(result.Response);
            
            // Verify methods were called
            _mockUserManager.Verify(x => x.FindByEmailAsync(It.IsAny<string>()), Times.Once);
            _mockSignInManager.Verify(x => x.CheckPasswordSignInAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>(), It.IsAny<bool>()), Times.Once);
            _mockUserManager.Verify(x => x.GetRolesAsync(It.IsAny<ApplicationUser>()), Times.Never);
        }

        [Fact]
        public async Task UpdateProfileAsync_WithValidData_ShouldReturnSuccess()
        {
            // Arrange
            var userId = "user123";
            var updateModel = new UpdateProfileModel
            {
                FirstName = "Updated",
                LastName = "User",
                Email = "test@example.com"
            };

            var user = new ApplicationUser
            {
                Id = userId,
                Email = "test@example.com",
                UserName = "test@example.com",
                FirstName = "Test",
                LastName = "User"
            };

            _mockUserManager.Setup(x => x.FindByIdAsync(It.IsAny<string>()))
                .ReturnsAsync(user);

            _mockUserManager.Setup(x => x.UpdateAsync(It.IsAny<ApplicationUser>()))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _authService.UpdateProfileAsync(userId, updateModel);

            // Assert
            Assert.True(result.Success);
            Assert.Equal("Profile updated successfully.", result.Message);
            Assert.NotNull(result.User);
            Assert.Equal("Updated", result.User.FirstName);
            Assert.Equal("User", result.User.LastName);
            
            // Verify methods were called
            _mockUserManager.Verify(x => x.FindByIdAsync(It.IsAny<string>()), Times.Once);
            _mockUserManager.Verify(x => x.UpdateAsync(It.IsAny<ApplicationUser>()), Times.Once);
        }

        [Fact]
        public async Task UpdateProfileAsync_WithEmailChange_ShouldRequirePassword()
        {
            // Arrange
            var userId = "user123";
            var updateModel = new UpdateProfileModel
            {
                FirstName = "Updated",
                LastName = "User",
                Email = "newemail@example.com" // Different from current
            };

            var user = new ApplicationUser
            {
                Id = userId,
                Email = "test@example.com",
                UserName = "test@example.com",
                FirstName = "Test",
                LastName = "User"
            };

            _mockUserManager.Setup(x => x.FindByIdAsync(It.IsAny<string>()))
                .ReturnsAsync(user);

            // Act
            var result = await _authService.UpdateProfileAsync(userId, updateModel);

            // Assert
            Assert.False(result.Success);
            Assert.Equal("Current password is required when changing email.", result.Message);
            Assert.Null(result.User);
            
            // Verify methods were called
            _mockUserManager.Verify(x => x.FindByIdAsync(It.IsAny<string>()), Times.Once);
            _mockUserManager.Verify(x => x.UpdateAsync(It.IsAny<ApplicationUser>()), Times.Never);
        }

        [Fact]
        public async Task UpdateProfileAsync_WithEmailChangeAndPassword_ShouldReturnSuccess()
        {
            // Arrange
            var userId = "user123";
            var updateModel = new UpdateProfileModel
            {
                FirstName = "Updated",
                LastName = "User",
                Email = "newemail@example.com", // Different from current
                CurrentPassword = "Password123!"
            };

            var user = new ApplicationUser
            {
                Id = userId,
                Email = "test@example.com",
                UserName = "test@example.com",
                FirstName = "Test",
                LastName = "User"
            };

            _mockUserManager.Setup(x => x.FindByIdAsync(It.IsAny<string>()))
                .ReturnsAsync(user);

            _mockUserManager.Setup(x => x.FindByEmailAsync(It.IsAny<string>()))
                .ReturnsAsync((ApplicationUser)null);

            _mockSignInManager.Setup(x => x.CheckPasswordSignInAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>(), It.IsAny<bool>()))
                .ReturnsAsync(SignInResult.Success);

            _mockUserManager.Setup(x => x.UpdateAsync(It.IsAny<ApplicationUser>()))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _authService.UpdateProfileAsync(userId, updateModel);

            // Assert
            Assert.True(result.Success);
            Assert.Equal("Profile updated successfully.", result.Message);
            Assert.NotNull(result.User);
            Assert.Equal("newemail@example.com", result.User.Email);
            Assert.Equal("newemail@example.com", result.User.UserName);
            Assert.Equal("Updated", result.User.FirstName);
            Assert.Equal("User", result.User.LastName);
            
            // Verify methods were called
            _mockUserManager.Verify(x => x.FindByIdAsync(It.IsAny<string>()), Times.Once);
            _mockSignInManager.Verify(x => x.CheckPasswordSignInAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>(), It.IsAny<bool>()), Times.Once);
            _mockUserManager.Verify(x => x.UpdateAsync(It.IsAny<ApplicationUser>()), Times.Once);
        }

        [Fact]
        public async Task AdminUpdateUserAsync_WithValidData_ShouldReturnSuccess()
        {
            // Arrange
            var adminUpdateModel = new AdminUpdateUserModel
            {
                UserId = "user123",
                FirstName = "Admin",
                LastName = "Updated",
                Email = "test@example.com"
            };

            var user = new ApplicationUser
            {
                Id = "user123",
                Email = "test@example.com",
                UserName = "test@example.com",
                FirstName = "Test",
                LastName = "User"
            };

            _mockUserManager.Setup(x => x.FindByIdAsync(It.IsAny<string>()))
                .ReturnsAsync(user);

            _mockUserManager.Setup(x => x.UpdateAsync(It.IsAny<ApplicationUser>()))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _authService.AdminUpdateUserAsync(adminUpdateModel);

            // Assert
            Assert.True(result.Success);
            Assert.Equal("User profile updated successfully.", result.Message);
            Assert.NotNull(result.User);
            Assert.Equal("Admin", result.User.FirstName);
            Assert.Equal("Updated", result.User.LastName);
            
            // Verify methods were called
            _mockUserManager.Verify(x => x.FindByIdAsync(It.IsAny<string>()), Times.Once);
            _mockUserManager.Verify(x => x.UpdateAsync(It.IsAny<ApplicationUser>()), Times.Once);
        }

        [Fact]
        public async Task GetUserByIdAsync_WithValidId_ShouldReturnUser()
        {
            // Arrange
            var userId = "user123";
            var user = new ApplicationUser
            {
                Id = userId,
                Email = "test@example.com",
                UserName = "test@example.com",
                FirstName = "Test",
                LastName = "User"
            };

            _mockUserManager.Setup(x => x.FindByIdAsync(It.IsAny<string>()))
                .ReturnsAsync(user);

            // Act
            var result = await _authService.GetUserByIdAsync(userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(userId, result.Id);
            Assert.Equal("test@example.com", result.Email);
            
            // Verify methods were called
            _mockUserManager.Verify(x => x.FindByIdAsync(It.IsAny<string>()), Times.Once);
        }
    }
}