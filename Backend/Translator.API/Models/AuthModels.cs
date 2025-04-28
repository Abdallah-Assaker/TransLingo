using System.ComponentModel.DataAnnotations;

namespace Translator.API.Models
{
    /// <summary>
    /// Represents the data model for a user registration request
    /// </summary>
    public class RegisterModel
    {
        /// <summary>
        /// The first name of the user
        /// </summary>
        [Required]
        [StringLength(50, MinimumLength = 2)]
        public string FirstName { get; set; } = string.Empty;
        
        /// <summary>
        /// The last name of the user
        /// </summary>
        [Required]
        [StringLength(50, MinimumLength = 2)]
        public string LastName { get; set; } = string.Empty;
        
        /// <summary>
        /// The email address of the user, which will be used as the username
        /// </summary>
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        /// <summary>
        /// The password for the user account
        /// </summary>
        [Required]
        [StringLength(100, MinimumLength = 6)]
        [DataType(DataType.Password)]
        public string Password { get; set; } = string.Empty;
        
        /// <summary>
        /// The password confirmation to ensure the user entered the correct password
        /// </summary>
        [Required]
        [DataType(DataType.Password)]
        [Compare("Password", ErrorMessage = "The password and confirmation password do not match.")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    /// <summary>
    /// Represents the data model for a user login request
    /// </summary>
    public class LoginModel
    {
        /// <summary>
        /// The email address of the user, which is used as the username
        /// </summary>
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        /// <summary>
        /// The password for the user account
        /// </summary>
        [Required]
        [DataType(DataType.Password)]
        public string Password { get; set; } = string.Empty;
        
        /// <summary>
        /// Indicates whether the browser should remember the user's login
        /// </summary>
        public bool RememberMe { get; set; }
    }

    /// <summary>
    /// Represents the response returned after successful authentication
    /// </summary>
    public class AuthResponse
    {
        /// <summary>
        /// The JWT token for the authenticated user
        /// </summary>
        public string Token { get; set; } = string.Empty;
        
        /// <summary>
        /// The expiration time of the token in UTC
        /// </summary>
        public DateTime Expiration { get; set; }
        
        /// <summary>
        /// The unique identifier for the user
        /// </summary>
        public string UserId { get; set; } = string.Empty;
        
        /// <summary>
        /// The email address of the user
        /// </summary>
        public string Email { get; set; } = string.Empty;
        
        /// <summary>
        /// The roles assigned to the user
        /// </summary>
        public List<string> Roles { get; set; } = new List<string>();
    }

    /// <summary>
    /// Model for updating a user profile
    /// </summary>
    public class UpdateProfileModel
    {
        /// <summary>
        /// The first name of the user
        /// </summary>
        [Required]
        [StringLength(50, MinimumLength = 2)]
        public string FirstName { get; set; } = string.Empty;
        
        /// <summary>
        /// The last name of the user
        /// </summary>
        [Required]
        [StringLength(50, MinimumLength = 2)]
        public string LastName { get; set; } = string.Empty;
        
        /// <summary>
        /// The email address of the user
        /// </summary>
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        /// <summary>
        /// The current password of the user (required when changing email)
        /// </summary>
        public string? CurrentPassword { get; set; }
    }

    /// <summary>
    /// Model for admin to update any user's profile
    /// </summary>
    public class AdminUpdateUserModel : UpdateProfileModel
    {
        /// <summary>
        /// The ID of the user to update
        /// </summary>
        [Required]
        public string UserId { get; set; } = string.Empty;
    }
}