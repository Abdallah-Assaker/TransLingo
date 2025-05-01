using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Translator.API.DbContext;
using Translator.API.Models;

namespace Translator.API.Services
{
    /// <summary>
    /// Service for managing translation requests
    /// </summary>
    public class TranslationRequestService : ITranslationRequestService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly string _uploadPath;

        /// <summary>
        /// Initializes a new instance of the TranslationRequestService
        /// </summary>
        /// <param name="context">The application database context</param>
        /// <param name="configuration">The application configuration</param>
        public TranslationRequestService(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
            
            // Get the file upload path from configuration or use a default
            _uploadPath = _configuration["FileStorage:UploadPath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
            
            // Ensure the directory exists
            if (!Directory.Exists(_uploadPath))
            {
                Directory.CreateDirectory(_uploadPath);
            }
        }

        /// <summary>
        /// Creates a new translation request
        /// </summary>
        /// <param name="request">The translation request to create</param>
        /// <param name="userId">The ID of the user creating the request</param>
        /// <returns>The created translation request</returns>
        public async Task<TranslationRequest> CreateRequestAsync(TranslationRequest request, string userId)
        {
            request.Id = Guid.NewGuid();
            request.UserId = userId;
            request.Status = TranslationStatus.Pending;
            request.CreatedAt = DateTime.UtcNow;
            
            await _context.TranslationRequests.AddAsync(request);
            await _context.SaveChangesAsync();
            
            return request;
        }

        /// <summary>
        /// Gets all translation requests for a specific user
        /// </summary>
        /// <param name="userId">The ID of the user</param>
        /// <returns>A list of translation requests for the user</returns>
        public async Task<IEnumerable<TranslationRequest>> GetUserRequestsAsync(string userId)
        {
            return await _context.TranslationRequests
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        /// <summary>
        /// Gets a translation request by ID
        /// </summary>
        /// <param name="requestId">The ID of the request</param>
        /// <param name="userId">The ID of the user (for authorization check)</param>
        /// <returns>The translation request if found and authorized, null otherwise</returns>
        public async Task<TranslationRequest?> GetRequestByIdAsync(Guid requestId, string userId)
        {
            return await _context.TranslationRequests
                .FirstOrDefaultAsync(r => r.Id == requestId && r.UserId == userId);
        }

        /// <summary>
        /// Updates an existing translation request
        /// </summary>
        /// <param name="request">The updated translation request</param>
        /// <param name="userId">The ID of the user updating the request</param>
        /// <returns>The updated translation request if successful, null otherwise</returns>
        public async Task<TranslationRequest?> UpdateRequestAsync(TranslationRequest request, string userId)
        {
            var existingRequest = await _context.TranslationRequests
                .FirstOrDefaultAsync(r => r.Id == request.Id && r.UserId == userId);
                
            if (existingRequest == null)
            {
                return null;
            }
            
            // Only allow updates for pending or rejected requests
            if (existingRequest.Status != TranslationStatus.Pending && existingRequest.Status != TranslationStatus.Rejected)
            {
                return null;
            }
            
            // Update properties that are allowed to be changed
            existingRequest.Title = request.Title;
            existingRequest.Description = request.Description;
            existingRequest.SourceLanguage = request.SourceLanguage;
            existingRequest.TargetLanguage = request.TargetLanguage;
            existingRequest.UserComment = request.UserComment;
            existingRequest.UpdatedAt = DateTime.UtcNow;
            
            // If the request was rejected and now being updated, change status to Resubmitted
            if (existingRequest.Status == TranslationStatus.Rejected)
            {
                existingRequest.Status = TranslationStatus.Resubmitted;
            }
            
            await _context.SaveChangesAsync();
            return existingRequest;
        }

        /// <summary>
        /// Deletes a translation request
        /// </summary>
        /// <param name="requestId">The ID of the request to delete</param>
        /// <param name="userId">The ID of the user deleting the request</param>
        /// <returns>True if deletion was successful, false otherwise</returns>
        public async Task<bool> DeleteRequestAsync(Guid requestId, string userId)
        {
            var request = await _context.TranslationRequests
                .FirstOrDefaultAsync(r => r.Id == requestId && r.UserId == userId);
                
            if (request == null)
            {
                return false;
            }
            
            // Only allow deletion for pending or rejected requests
            if (request.Status != TranslationStatus.Pending && 
                request.Status != TranslationStatus.Rejected &&
                request.Status != TranslationStatus.Resubmitted)
            {
                return false;
            }
            
            // Delete the associated files
            try
            {
                if (!string.IsNullOrEmpty(request.StoredFileName))
                {
                    var originalFilePath = Path.Combine(_uploadPath, request.StoredFileName);
                    if (File.Exists(originalFilePath))
                    {
                        File.Delete(originalFilePath);
                    }
                }
                
                if (!string.IsNullOrEmpty(request.TranslatedFileName))
                {
                    var translatedFilePath = Path.Combine(_uploadPath, request.TranslatedFileName);
                    if (File.Exists(translatedFilePath))
                    {
                        File.Delete(translatedFilePath);
                    }
                }
            }
            catch (Exception)
            {
                // Log the error but continue with request deletion
            }
            
            _context.TranslationRequests.Remove(request);
            await _context.SaveChangesAsync();
            
            return true;
        }

        /// <summary>
        /// Saves an uploaded file for a translation request
        /// </summary>
        /// <param name="fileContent">The content of the file</param>
        /// <param name="originalFileName">The original name of the file</param>
        /// <returns>The stored file name</returns>
        public async Task<string> SaveFileAsync(byte[] fileContent, string originalFileName)
        {
            // Generate a unique filename to avoid collisions
            var fileExtension = Path.GetExtension(originalFileName);
            var storedFileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(_uploadPath, storedFileName);
            
            await File.WriteAllBytesAsync(filePath, fileContent);
            
            return storedFileName;
        }

        /// <summary>
        /// Gets a file by its stored name
        /// </summary>
        /// <param name="storedFileName">The stored name of the file</param>
        /// <returns>The file content as a byte array</returns>
        public async Task<byte[]> GetFileAsync(string storedFileName)
        {
            var filePath = Path.Combine(_uploadPath, storedFileName);
            
            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException($"File not found: {storedFileName}");
            }
            
            return await File.ReadAllBytesAsync(filePath);
        }

        /// <summary>
        /// Gets all translation requests (admin function)
        /// </summary>
        /// <returns>A list of all translation requests</returns>
        public async Task<IEnumerable<TranslationRequest>> GetAllRequestsAsync()
        {
            return await _context.TranslationRequests
                .Include(r => r.User)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        /// <summary>
        /// Gets a translation request by ID (admin function - no user ID check)
        /// </summary>
        /// <param name="requestId">The ID of the request</param>
        /// <returns>The translation request if found, null otherwise</returns>
        public async Task<TranslationRequest?> GetRequestByIdForAdminAsync(Guid requestId)
        {
            return await _context.TranslationRequests
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Id == requestId);
        }

        /// <summary>
        /// Approves a translation request
        /// </summary>
        /// <param name="requestId">The ID of the request to approve</param>
        /// <param name="adminComment">Optional comment from the admin</param>
        /// <returns>The updated translation request if successful, null otherwise</returns>
        public async Task<TranslationRequest?> ApproveRequestAsync(Guid requestId, string? adminComment)
        {
            var request = await _context.TranslationRequests
                .FirstOrDefaultAsync(r => r.Id == requestId);
                
            if (request == null)
            {
                return null;
            }
            
            // Only pending or resubmitted requests can be approved
            if (request.Status != TranslationStatus.Pending && request.Status != TranslationStatus.Resubmitted)
            {
                return null;
            }
            
            request.Status = TranslationStatus.Approved;
            request.AdminComment = adminComment;
            request.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            return request;
        }

        /// <summary>
        /// Rejects a translation request
        /// </summary>
        /// <param name="requestId">The ID of the request to reject</param>
        /// <param name="adminComment">Comment explaining the rejection reason</param>
        /// <returns>The updated translation request if successful, null otherwise</returns>
        public async Task<TranslationRequest?> RejectRequestAsync(Guid requestId, string adminComment)
        {
            if (string.IsNullOrWhiteSpace(adminComment))
            {
                throw new ArgumentException("Admin comment is required for rejecting a request");
            }
            
            var request = await _context.TranslationRequests
                .FirstOrDefaultAsync(r => r.Id == requestId);
                
            if (request == null)
            {
                return null;
            }
            
            // Only pending or resubmitted requests can be rejected
            if (request.Status != TranslationStatus.Pending && request.Status != TranslationStatus.Resubmitted)
            {
                return null;
            }
            
            request.Status = TranslationStatus.Rejected;
            request.AdminComment = adminComment;
            request.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            return request;
        }

        /// <summary>
        /// Completes a translation request with an uploaded translated file
        /// </summary>
        /// <param name="requestId">The ID of the request to complete</param>
        /// <param name="fileContent">The content of the translated file</param>
        /// <param name="originalFileName">The original name of the translated file</param>
        /// <param name="adminComment">Optional comment from the admin</param>
        /// <returns>The updated translation request if successful, null otherwise</returns>
        public async Task<TranslationRequest?> CompleteRequestAsync(Guid requestId, byte[] fileContent, string originalFileName, string? adminComment)
        {
            var request = await _context.TranslationRequests
                .FirstOrDefaultAsync(r => r.Id == requestId);
                
            if (request == null)
            {
                return null;
            }
            
            // Only approved requests can be completed
            if (request.Status != TranslationStatus.Approved)
            {
                return null;
            }
            
            // Save the translated file
            var translatedFileName = await SaveFileAsync(fileContent, originalFileName);
            
            request.Status = TranslationStatus.Completed;
            request.TranslatedFileName = translatedFileName;
            request.AdminComment = adminComment;
            request.UpdatedAt = DateTime.UtcNow;
            request.CompletedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            return request;
        }

        /// <summary>
        /// Resubmits a rejected translation request with a new file
        /// </summary>
        /// <param name="requestId">The ID of the request to resubmit</param>
        /// <param name="fileContent">The content of the new file (optional)</param>
        /// <param name="originalFileName">The original name of the new file (required if fileContent is provided)</param>
        /// <param name="userComment">Comment explaining the resubmission</param>
        /// <param name="userId">The ID of the user resubmitting the request</param>
        /// <returns>The updated translation request if successful, null otherwise</returns>
        public async Task<TranslationRequest?> ResubmitRequestAsync(Guid requestId, byte[]? fileContent, string? originalFileName, string userComment, string userId)
        {
            if (string.IsNullOrWhiteSpace(userComment))
            {
                throw new ArgumentException("User comment is required for resubmitting a request");
            }
            
            if (fileContent != null && string.IsNullOrWhiteSpace(originalFileName))
            {
                throw new ArgumentException("Original file name is required when providing a new file");
            }
            
            var request = await _context.TranslationRequests
                .FirstOrDefaultAsync(r => r.Id == requestId && r.UserId == userId);
                
            if (request == null)
            {
                return null;
            }
            
            // Only rejected requests can be resubmitted
            if (request.Status != TranslationStatus.Rejected)
            {
                return null;
            }
            
            // If a new file is provided, save it and update file info
            if (fileContent != null && !string.IsNullOrWhiteSpace(originalFileName))
            {
                // Delete old file if it exists
                try
                {
                    if (!string.IsNullOrEmpty(request.StoredFileName))
                    {
                        var oldFilePath = Path.Combine(_uploadPath, request.StoredFileName);
                        if (File.Exists(oldFilePath))
                        {
                            File.Delete(oldFilePath);
                        }
                    }
                }
                catch (Exception)
                {
                    // Log the error but continue with file update
                }
                
                // Save the new file
                var storedFileName = await SaveFileAsync(fileContent, originalFileName);
                
                // Update file info
                request.OriginalFileName = originalFileName;
                request.StoredFileName = storedFileName;
            }
            
            // Update request status and comments
            request.Status = TranslationStatus.Resubmitted;
            request.UserComment = userComment;
            request.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            return request;
        }
    }
}