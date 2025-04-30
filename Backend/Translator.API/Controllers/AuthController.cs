using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Translator.API.Models;
using Translator.API.Services;

namespace Translator.API.Controllers
{
    /// <summary>
    /// Controller for handling authentication-related requests
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly UserManager<ApplicationUser> _userManager;

        /// <summary>
        /// Initializes a new instance of the AuthController
        /// </summary>
        /// <param name="authService">The authentication service</param>
        /// <param name="userManager">The ASP.NET Core Identity UserManager</param>
        public AuthController(IAuthService authService, UserManager<ApplicationUser> userManager)
        {
            _authService = authService;
            _userManager = userManager;
        }

        /// <summary>
        /// Registers a new user in the system
        /// </summary>
        /// <param name="model">The registration data for the new user</param>
        /// <returns>Result of the registration operation</returns>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.RegisterAsync(model);

            if (!result.Success)
                return BadRequest(new { Message = result.Message });

            return Ok(new { Message = result.Message });
        }

        /// <summary>
        /// Authenticates a user and returns a JWT token
        /// </summary>
        /// <param name="model">The login credentials</param>
        /// <returns>Authentication response with token if successful</returns>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.LoginAsync(model);

            if (!result.Success)
                return Unauthorized(new { Message = result.Message });

            return Ok(result.Response);
        }

        /// <summary>
        /// Gets the current user's profile information
        /// </summary>
        /// <returns>User profile information</returns>
        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetProfile()
        {
            // Get the current user's ID from the claims
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { Message = "User not authenticated or session expired." });

            var user = await _authService.GetUserByIdAsync(userId);
            if (user == null)
                return NotFound(new { Message = "User not found." });

            // Return user profile information
            return Ok(new
            {
                UserId = user.Id,
                user.FirstName,
                user.LastName,
                user.Email,
                user.UserName,
                user.CreatedAt,
                user.UpdatedAt
            });
        }

        /// <summary>
        /// Updates the current user's profile
        /// </summary>
        /// <param name="model">The updated profile data</param>
        /// <returns>Result of the update operation</returns>
        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Get the current user's ID from the claims
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { Message = "User not authenticated or session expired." });

            var result = await _authService.UpdateProfileAsync(userId, model);

            if (!result.Success)
                return BadRequest(new { Message = result.Message });

            return Ok(new
            {
                Message = result.Message,
                User = new
                {
                    UserId = result.User!.Id,
                    result.User.FirstName,
                    result.User.LastName,
                    result.User.Email,
                    result.User.UserName,
                    result.User.CreatedAt,
                    result.User.UpdatedAt
                }
            });
        }

        /// <summary>
        /// Gets a list of all users (Admin only)
        /// </summary>
        /// <returns>List of all users</returns>
        [HttpGet("users")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllUsers()
        {
            // Use synchronous ToList() for better testability
            var users = _userManager.Users.ToList();
            
            var usersList = users.Select(user => new
            {
                UserId = user.Id,
                user.FirstName,
                user.LastName,
                user.Email,
                user.UserName,
                user.CreatedAt,
                user.UpdatedAt
            });
            
            return Ok(usersList);
        }

        /// <summary>
        /// Gets a user's profile information (Admin only)
        /// </summary>
        /// <param name="userId">The ID of the user to retrieve</param>
        /// <returns>User profile information</returns>
        [HttpGet("users/{userId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUserById(string userId)
        {
            var user = await _authService.GetUserByIdAsync(userId);
            if (user == null)
                return NotFound(new { Message = "User not found." });

            // Return user profile information
            return Ok(new
            {
                UserId = user.Id,
                user.FirstName,
                user.LastName,
                user.Email,
                user.UserName,
                user.CreatedAt,
                user.UpdatedAt
            });
        }

        /// <summary>
        /// Updates any user's profile (Admin only)
        /// </summary>
        /// <param name="model">The admin update user model containing user ID and profile data</param>
        /// <returns>Result of the update operation</returns>
        [HttpPut("users")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminUpdateUser([FromBody] AdminUpdateUserModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.AdminUpdateUserAsync(model);

            if (!result.Success)
                return BadRequest(new { Message = result.Message });

            return Ok(new
            {
                Message = result.Message,
                User = new
                {
                    UserId = result.User!.Id,
                    result.User.FirstName,
                    result.User.LastName,
                    result.User.Email,
                    result.User.UserName,
                    result.User.CreatedAt,
                    result.User.UpdatedAt
                }
            });
        }
    }
}