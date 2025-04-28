using Microsoft.AspNetCore.Identity;

namespace Translator.API.Models
{
    /// <summary>
    /// Represents a user in the application with additional properties beyond the base IdentityUser
    /// </summary>
    public class ApplicationUser : IdentityUser
    {
        /// <summary>
        /// The first name of the user
        /// </summary>
        public string FirstName { get; set; } = string.Empty;
        
        /// <summary>
        /// The last name of the user
        /// </summary>
        public string LastName { get; set; } = string.Empty;
        
        /// <summary>
        /// The date and time when the user was created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        /// <summary>
        /// The date and time when the user was last updated
        /// </summary>
        public DateTime? UpdatedAt { get; set; }
    }
}