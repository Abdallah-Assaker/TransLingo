using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Translator.API.Models
{
    /// <summary>
    /// Represents a translation request in the application
    /// </summary>
    public class TranslationRequest
    {
        /// <summary>
        /// The unique identifier for the translation request
        /// </summary>
        [Key]
        public Guid Id { get; set; }
        
        /// <summary>
        /// The title of the translation request
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;
        
        /// <summary>
        /// The description of the translation request
        /// </summary>
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;
        
        /// <summary>
        /// The source language of the document
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string SourceLanguage { get; set; } = string.Empty;
        
        /// <summary>
        /// The target language for translation
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string TargetLanguage { get; set; } = string.Empty;
        
        /// <summary>
        /// The original filename of the uploaded document
        /// </summary>
        [Required]
        [MaxLength(255)]
        public string OriginalFileName { get; set; } = string.Empty;
        
        /// <summary>
        /// The stored filename of the uploaded document in the server
        /// </summary>
        [Required]
        [MaxLength(255)]
        public string StoredFileName { get; set; } = string.Empty;
        
        /// <summary>
        /// The stored filename of the translated document in the server
        /// </summary>
        [MaxLength(255)]
        public string? TranslatedFileName { get; set; }
        
        /// <summary>
        /// The status of the translation request
        /// </summary>
        public TranslationStatus Status { get; set; } = TranslationStatus.Pending;
        
        /// <summary>
        /// Admin comments on the translation request
        /// </summary>
        [MaxLength(500)]
        public string? AdminComment { get; set; }
        
        /// <summary>
        /// User comments on the translation request
        /// </summary>
        [MaxLength(500)]
        public string? UserComment { get; set; }
        
        /// <summary>
        /// The date and time when the request was created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        /// <summary>
        /// The date and time when the request was last updated
        /// </summary>
        public DateTime? UpdatedAt { get; set; }
        
        /// <summary>
        /// The date and time when the request was completed
        /// </summary>
        public DateTime? CompletedAt { get; set; }
        
        /// <summary>
        /// The ID of the user who created the request
        /// </summary>
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        /// <summary>
        /// The user who created the request
        /// </summary>
        [ForeignKey("UserId")]
        public virtual ApplicationUser? User { get; set; }
    }
}