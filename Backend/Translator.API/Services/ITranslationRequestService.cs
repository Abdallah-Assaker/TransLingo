using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Translator.API.Models;

namespace Translator.API.Services
{
    /// <summary>
    /// Interface for translation request service operations
    /// </summary>
    public interface ITranslationRequestService
    {
        /// <summary>
        /// Creates a new translation request
        /// </summary>
        /// <param name="request">The translation request to create</param>
        /// <param name="userId">The ID of the user creating the request</param>
        /// <returns>The created translation request</returns>
        Task<TranslationRequest> CreateRequestAsync(TranslationRequest request, string userId);
        
        /// <summary>
        /// Gets all translation requests for a specific user
        /// </summary>
        /// <param name="userId">The ID of the user</param>
        /// <returns>A list of translation requests for the user</returns>
        Task<IEnumerable<TranslationRequest>> GetUserRequestsAsync(string userId);
        
        /// <summary>
        /// Gets a translation request by ID
        /// </summary>
        /// <param name="requestId">The ID of the request</param>
        /// <param name="userId">The ID of the user (for authorization check)</param>
        /// <returns>The translation request if found and authorized, null otherwise</returns>
        Task<TranslationRequest?> GetRequestByIdAsync(Guid requestId, string userId);
        
        /// <summary>
        /// Updates an existing translation request
        /// </summary>
        /// <param name="request">The updated translation request</param>
        /// <param name="userId">The ID of the user updating the request</param>
        /// <returns>The updated translation request if successful, null otherwise</returns>
        Task<TranslationRequest?> UpdateRequestAsync(TranslationRequest request, string userId);
        
        /// <summary>
        /// Deletes a translation request
        /// </summary>
        /// <param name="requestId">The ID of the request to delete</param>
        /// <param name="userId">The ID of the user deleting the request</param>
        /// <returns>True if deletion was successful, false otherwise</returns>
        Task<bool> DeleteRequestAsync(Guid requestId, string userId);
        
        /// <summary>
        /// Saves an uploaded file for a translation request
        /// </summary>
        /// <param name="fileContent">The content of the file</param>
        /// <param name="originalFileName">The original name of the file</param>
        /// <returns>The stored file name</returns>
        Task<string> SaveFileAsync(byte[] fileContent, string originalFileName);
        
        /// <summary>
        /// Gets a file by its stored name
        /// </summary>
        /// <param name="storedFileName">The stored name of the file</param>
        /// <returns>The file content as a byte array</returns>
        Task<byte[]> GetFileAsync(string storedFileName);
        
        /// <summary>
        /// Gets all translation requests (admin function)
        /// </summary>
        /// <returns>A list of all translation requests</returns>
        Task<IEnumerable<TranslationRequest>> GetAllRequestsAsync();
        
        /// <summary>
        /// Gets a translation request by ID (admin function - no user ID check)
        /// </summary>
        /// <param name="requestId">The ID of the request</param>
        /// <returns>The translation request if found, null otherwise</returns>
        Task<TranslationRequest?> GetRequestByIdForAdminAsync(Guid requestId);
        
        /// <summary>
        /// Approves a translation request
        /// </summary>
        /// <param name="requestId">The ID of the request to approve</param>
        /// <param name="adminComment">Optional comment from the admin</param>
        /// <returns>The updated translation request if successful, null otherwise</returns>
        Task<TranslationRequest?> ApproveRequestAsync(Guid requestId, string? adminComment);
        
        /// <summary>
        /// Rejects a translation request
        /// </summary>
        /// <param name="requestId">The ID of the request to reject</param>
        /// <param name="adminComment">Comment explaining the rejection reason</param>
        /// <returns>The updated translation request if successful, null otherwise</returns>
        Task<TranslationRequest?> RejectRequestAsync(Guid requestId, string adminComment);
        
        /// <summary>
        /// Completes a translation request with an uploaded translated file
        /// </summary>
        /// <param name="requestId">The ID of the request to complete</param>
        /// <param name="fileContent">The content of the translated file</param>
        /// <param name="originalFileName">The original name of the translated file</param>
        /// <param name="adminComment">Optional comment from the admin</param>
        /// <returns>The updated translation request if successful, null otherwise</returns>
        Task<TranslationRequest?> CompleteRequestAsync(Guid requestId, byte[] fileContent, string originalFileName, string? adminComment);

        /// <summary>
        /// Resubmits a rejected translation request with a new file
        /// </summary>
        /// <param name="requestId">The ID of the request to resubmit</param>
        /// <param name="fileContent">The content of the new file (optional)</param>
        /// <param name="originalFileName">The original name of the new file (required if fileContent is provided)</param>
        /// <param name="userComment">Comment explaining the resubmission</param>
        /// <param name="userId">The ID of the user resubmitting the request</param>
        /// <returns>The updated translation request if successful, null otherwise</returns>
        Task<TranslationRequest?> ResubmitRequestAsync(Guid requestId, byte[]? fileContent, string? originalFileName, string userComment, string userId);
    }
}