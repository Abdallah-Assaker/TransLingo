using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Translator.API.Models;

namespace Translator.API.DbContext
{
    /// <summary>
    /// Database context for the Translator application, extending IdentityDbContext to include Identity tables
    /// </summary>
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        /// <summary>
        /// Initializes a new instance of the ApplicationDbContext
        /// </summary>
        /// <param name="options">The options to be used by the DbContext</param>
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }
        
        /// <summary>
        /// Gets or sets the translation requests in the database
        /// </summary>
        public DbSet<TranslationRequest> TranslationRequests { get; set; }

        /// <summary>
        /// Configures the database model
        /// </summary>
        /// <param name="builder">The ModelBuilder to use for configuration</param>
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure TranslationRequest entity
            builder.Entity<TranslationRequest>()
                .HasOne(tr => tr.User)
                .WithMany()
                .HasForeignKey(tr => tr.UserId)
                .OnDelete(DeleteBehavior.Restrict);
                
            // Add any additional model configuration here
        }
    }
}