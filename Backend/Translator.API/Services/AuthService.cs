using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Translator.API.Models;

namespace Translator.API.Services
{
    /// <summary>
    /// Service for handling authentication-related operations
    /// </summary>
    public interface IAuthService
    {
        /// <summary>
        /// Registers a new user in the system
        /// </summary>
        /// <param name="model">The registration data for the new user</param>
        /// <returns>Result of the registration operation</returns>
        Task<(bool Success, string Message, ApplicationUser? User)> RegisterAsync(RegisterModel model);

        /// <summary>
        /// Authenticates a user and generates a JWT token
        /// </summary>
        /// <param name="model">The login credentials</param>
        /// <returns>Authentication response with token if successful</returns>
        Task<(bool Success, string Message, AuthResponse? Response)> LoginAsync(LoginModel model);

        /// <summary>
        /// Creates a JWT token for the specified user
        /// </summary>
        /// <param name="user">The user for whom to create a token</param>
        /// <returns>Authentication response with token information</returns>
        Task<AuthResponse> CreateTokenAsync(ApplicationUser user);

        /// <summary>
        /// Updates a user's profile
        /// </summary>
        /// <param name="userId">The ID of the user to update</param>
        /// <param name="model">The updated profile data</param>
        /// <returns>Result of the update operation with the updated user</returns>
        Task<(bool Success, string Message, ApplicationUser? User)> UpdateProfileAsync(string userId, UpdateProfileModel model);

        /// <summary>
        /// Updates any user's profile (for admin use)
        /// </summary>
        /// <param name="model">The admin update user model containing user ID and profile data</param>
        /// <returns>Result of the admin update operation with the updated user</returns>
        Task<(bool Success, string Message, ApplicationUser? User)> AdminUpdateUserAsync(AdminUpdateUserModel model);

        /// <summary>
        /// Gets a user by their ID
        /// </summary>
        /// <param name="userId">The ID of the user to retrieve</param>
        /// <returns>The user if found, null otherwise</returns>
        Task<ApplicationUser?> GetUserByIdAsync(string userId);
    }

    /// <summary>
    /// Implementation of the authentication service
    /// </summary>
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IConfiguration _configuration;

        /// <summary>
        /// Initializes a new instance of the AuthService
        /// </summary>
        /// <param name="userManager">The ASP.NET Core Identity UserManager</param>
        /// <param name="signInManager">The ASP.NET Core Identity SignInManager</param>
        /// <param name="configuration">The application configuration</param>
        public AuthService(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
        }

        /// <summary>
        /// Registers a new user in the system
        /// </summary>
        /// <param name="model">The registration data for the new user</param>
        /// <returns>Result of the registration operation</returns>
        public async Task<(bool Success, string Message, ApplicationUser? User)> RegisterAsync(RegisterModel model)
        {
            // Check if user already exists
            var userExists = await _userManager.FindByEmailAsync(model.Email);
            if (userExists != null)
                return (false, "User already exists!", null);

            // Create the new user with the provided information
            ApplicationUser user = new()
            {
                Email = model.Email,
                UserName = model.Email,
                FirstName = model.FirstName,
                LastName = model.LastName,
                SecurityStamp = Guid.NewGuid().ToString(),
            };

            // Attempt to create the user in the database
            var result = await _userManager.CreateAsync(user, model.Password);

            if (!result.Succeeded)
                return (false, string.Join(", ", result.Errors.Select(e => e.Description)), null);

            // Assign the default user role to the newly created user
            await _userManager.AddToRoleAsync(user, "User");

            return (true, "User created successfully!", user);
        }

        /// <summary>
        /// Authenticates a user and generates a JWT token
        /// </summary>
        /// <param name="model">The login credentials</param>
        /// <returns>Authentication response with token if successful</returns>
        public async Task<(bool Success, string Message, AuthResponse? Response)> LoginAsync(LoginModel model)
        {
            // Find the user by email
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
                return (false, "Invalid credentials.", null);

            // Verify the password is correct
            var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);
            if (!result.Succeeded)
                return (false, "Invalid credentials.", null);

            // Generate the authentication token
            var token = await CreateTokenAsync(user);
            return (true, "Login successful.", token);
        }

        /// <summary>
        /// Creates a JWT token for the specified user
        /// </summary>
        /// <param name="user">The user for whom to create a token</param>
        /// <returns>Authentication response with token information</returns>
        public async Task<AuthResponse> CreateTokenAsync(ApplicationUser user)
        {
            // Get the roles associated with the user
            var userRoles = await _userManager.GetRolesAsync(user);

            // Create a list of claims for the token
            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.UserName ?? string.Empty),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id)
            };

            // Add role claims
            foreach (var userRole in userRoles)
            {
                authClaims.Add(new Claim(ClaimTypes.Role, userRole));
            }

            // Get the signing key from configuration
            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JWT:Secret"] ?? "fallbackSecretKey1234567890123456789012"));

            // Set token expiration time
            var tokenExpiryHours = 24; // Default to 24 hours if not specified in configuration
            if (int.TryParse(_configuration["JWT:TokenValidityInHours"], out int configuredHours))
            {
                tokenExpiryHours = configuredHours;
            }

            var token = new JwtSecurityToken(
                issuer: _configuration["JWT:ValidIssuer"],
                audience: _configuration["JWT:ValidAudience"],
                expires: DateTime.UtcNow.AddHours(tokenExpiryHours),
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );

            // Create and return the auth response
            return new AuthResponse
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                Expiration = token.ValidTo,
                UserId = user.Id,
                Email = user.Email ?? string.Empty,
                Roles = userRoles.ToList()
            };
        }

        /// <summary>
        /// Updates a user's profile
        /// </summary>
        /// <param name="userId">The ID of the user to update</param>
        /// <param name="model">The updated profile data</param>
        /// <returns>Result of the update operation with the updated user</returns>
        public async Task<(bool Success, string Message, ApplicationUser? User)> UpdateProfileAsync(string userId, UpdateProfileModel model)
        {
            // Find the user by ID
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return (false, "User not found.", null);

            // Check if email is being changed
            bool isEmailChanged = !string.Equals(user.Email, model.Email, StringComparison.OrdinalIgnoreCase);
            
            if (isEmailChanged)
            {
                // Check if the new email already exists
                var existingUser = await _userManager.FindByEmailAsync(model.Email);
                if (existingUser != null && existingUser.Id != userId)
                    return (false, "Email already in use by another account.", null);
                
                // If changing email, we require the current password
                if (string.IsNullOrEmpty(model.CurrentPassword))
                    return (false, "Current password is required when changing email.", null);
                
                // Verify the password is correct
                var passwordCheck = await _signInManager.CheckPasswordSignInAsync(user, model.CurrentPassword, false);
                if (!passwordCheck.Succeeded)
                    return (false, "Current password is incorrect.", null);
                
                // Update the email and username (since we use email as username)
                user.Email = model.Email;
                user.UserName = model.Email;
                
                // Need to update normalized values
                user.NormalizedEmail = _userManager.NormalizeEmail(model.Email);
                user.NormalizedUserName = _userManager.NormalizeName(model.Email);
            }
            
            // Update other user properties
            user.FirstName = model.FirstName;
            user.LastName = model.LastName;
            user.UpdatedAt = DateTime.UtcNow;

            // Save the changes
            var result = await _userManager.UpdateAsync(user);
            
            if (!result.Succeeded)
                return (false, string.Join(", ", result.Errors.Select(e => e.Description)), null);
            
            return (true, "Profile updated successfully.", user);
        }

        /// <summary>
        /// Updates any user's profile (for admin use)
        /// </summary>
        /// <param name="model">The admin update user model containing user ID and profile data</param>
        /// <returns>Result of the admin update operation with the updated user</returns>
        public async Task<(bool Success, string Message, ApplicationUser? User)> AdminUpdateUserAsync(AdminUpdateUserModel model)
        {
            // Find the user by ID
            var user = await _userManager.FindByIdAsync(model.UserId);
            if (user == null)
                return (false, "User not found.", null);

            // Check if email is being changed
            bool isEmailChanged = !string.Equals(user.Email, model.Email, StringComparison.OrdinalIgnoreCase);
            
            if (isEmailChanged)
            {
                // Check if the new email already exists
                var existingUser = await _userManager.FindByEmailAsync(model.Email);
                if (existingUser != null && existingUser.Id != model.UserId)
                    return (false, "Email already in use by another account.", null);
                
                // Update the email and username (since we use email as username)
                user.Email = model.Email;
                user.UserName = model.Email;
                
                // Need to update normalized values
                user.NormalizedEmail = _userManager.NormalizeEmail(model.Email);
                user.NormalizedUserName = _userManager.NormalizeName(model.Email);
            }
            
            // Update other user properties
            user.FirstName = model.FirstName;
            user.LastName = model.LastName;
            user.UpdatedAt = DateTime.UtcNow;

            // Save the changes
            var result = await _userManager.UpdateAsync(user);
            
            if (!result.Succeeded)
                return (false, string.Join(", ", result.Errors.Select(e => e.Description)), null);
            
            return (true, "User profile updated successfully.", user);
        }

        /// <summary>
        /// Gets a user by their ID
        /// </summary>
        /// <param name="userId">The ID of the user to retrieve</param>
        /// <returns>The user if found, null otherwise</returns>
        public async Task<ApplicationUser?> GetUserByIdAsync(string userId)
        {
            return await _userManager.FindByIdAsync(userId);
        }
    }
}