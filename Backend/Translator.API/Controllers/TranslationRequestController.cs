using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;
using Translator.API.Models;
using Translator.API.Services;

namespace Translator.API.Controllers
{
    /// <summary>
    /// Controller for managing user translation requests
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "User,Admin")]
    public class TranslationRequestController : ControllerBase
    {
        private readonly ITranslationRequestService _translationRequestService;
        
        /// <summary>
        /// Initializes a new instance of the TranslationRequestController
        /// </summary>
        /// <param name="translationRequestService">The translation request service</param>
        public TranslationRequestController(ITranslationRequestService translationRequestService)
        {
            _translationRequestService = translationRequestService;
        }
        
        /// <summary>
        /// Gets the current user ID from the claims
        /// </summary>
        private string GetUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier);
        }
        
        /// <summary>
        /// Creates a new translation request
        /// </summary>
        /// <param name="model">The form data for the translation request</param>
        /// <returns>The created translation request</returns>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [RequestFormLimits(MultipartBodyLengthLimit = 10485760)] // 10MB
        public async Task<IActionResult> CreateRequest([FromForm] TranslationRequestFormModel model)
        {
            if (model.File == null || model.File.Length == 0)
            {
                return BadRequest("File is required");
            }
            
            if (string.IsNullOrEmpty(model.Title) || string.IsNullOrEmpty(model.SourceLanguage) || string.IsNullOrEmpty(model.TargetLanguage))
            {
                return BadRequest("Title, source language, and target language are required");
            }
            
            // Check file extension
            var fileExtension = Path.GetExtension(model.File.FileName).ToLowerInvariant();
            var allowedExtensions = new[] { ".txt", ".doc", ".docx", ".pdf" };
            
            if (!Array.Exists(allowedExtensions, ext => ext == fileExtension))
            {
                return BadRequest("File type not supported. Allowed types: txt, doc, docx, pdf");
            }
            
            // Save the file
            byte[] fileContent;
            using (var memoryStream = new MemoryStream())
            {
                await model.File.CopyToAsync(memoryStream);
                fileContent = memoryStream.ToArray();
            }
            
            var storedFileName = await _translationRequestService.SaveFileAsync(fileContent, model.File.FileName);
            
            // Create request
            var request = new TranslationRequest
            {
                Title = model.Title,
                Description = model.Description,
                SourceLanguage = model.SourceLanguage,
                TargetLanguage = model.TargetLanguage,
                OriginalFileName = model.File.FileName,
                StoredFileName = storedFileName,
                UserComment = model.UserComment
            };
            
            var createdRequest = await _translationRequestService.CreateRequestAsync(request, GetUserId());
            
            return CreatedAtAction(nameof(GetRequest), new { id = createdRequest.Id }, createdRequest);
        }
        
        /// <summary>
        /// Gets all translation requests for the current user
        /// </summary>
        /// <returns>A list of translation requests</returns>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<TranslationRequest>>> GetUserRequests()
        {
            var requests = await _translationRequestService.GetUserRequestsAsync(GetUserId());
            return Ok(requests);
        }
        
        /// <summary>
        /// Gets a specific translation request by ID
        /// </summary>
        /// <param name="id">The ID of the request</param>
        /// <returns>The translation request if found</returns>
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<TranslationRequest>> GetRequest(Guid id)
        {
            var request = await _translationRequestService.GetRequestByIdAsync(id, GetUserId());
            
            if (request == null)
            {
                return NotFound();
            }
            
            return Ok(request);
        }
        
        /// <summary>
        /// Updates an existing translation request
        /// </summary>
        /// <param name="id">The ID of the request to update</param>
        /// <param name="model">The updated request data</param>
        /// <returns>The updated translation request</returns>
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateRequest(Guid id, [FromBody] TranslationRequestUpdateModel model)
        {
            if (id != model.Id)
            {
                return BadRequest("ID mismatch");
            }
            
            var request = new TranslationRequest
            {
                Id = model.Id,
                Title = model.Title,
                Description = model.Description,
                SourceLanguage = model.SourceLanguage,
                TargetLanguage = model.TargetLanguage,
                UserComment = model.UserComment
            };
            
            var updatedRequest = await _translationRequestService.UpdateRequestAsync(request, GetUserId());
            
            if (updatedRequest == null)
            {
                return NotFound("Request not found or cannot be updated");
            }
            
            return Ok(updatedRequest);
        }
        
        /// <summary>
        /// Deletes a translation request
        /// </summary>
        /// <param name="id">The ID of the request to delete</param>
        /// <returns>No content if successful</returns>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DeleteRequest(Guid id)
        {
            var success = await _translationRequestService.DeleteRequestAsync(id, GetUserId());
            
            if (!success)
            {
                return NotFound("Request not found or cannot be deleted");
            }
            
            return NoContent();
        }
        
        /// <summary>
        /// Downloads the original file for a translation request
        /// </summary>
        /// <param name="id">The ID of the request</param>
        /// <returns>The file as a download</returns>
        [HttpGet("{id}/download-original")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DownloadOriginalFile(Guid id)
        {
            var request = await _translationRequestService.GetRequestByIdAsync(id, GetUserId());
            
            if (request == null)
            {
                return NotFound();
            }
            
            try
            {
                var fileContent = await _translationRequestService.GetFileAsync(request.StoredFileName);
                return File(fileContent, "application/octet-stream", request.OriginalFileName);
            }
            catch (FileNotFoundException)
            {
                return NotFound("File not found");
            }
        }
        
        /// <summary>
        /// Downloads the translated file for a translation request
        /// </summary>
        /// <param name="id">The ID of the request</param>
        /// <returns>The file as a download</returns>
        [HttpGet("{id}/download-translated")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DownloadTranslatedFile(Guid id)
        {
            var request = await _translationRequestService.GetRequestByIdAsync(id, GetUserId());
            
            if (request == null)
            {
                return NotFound();
            }
            
            if (request.Status != TranslationStatus.Completed || string.IsNullOrEmpty(request.TranslatedFileName))
            {
                return BadRequest("Translation is not completed or translated file is not available");
            }
            
            try
            {
                var fileContent = await _translationRequestService.GetFileAsync(request.TranslatedFileName);
                var translatedFileName = $"Translated_{request.OriginalFileName}";
                return File(fileContent, "application/octet-stream", translatedFileName);
            }
            catch (FileNotFoundException)
            {
                return NotFound("File not found");
            }
        }
        
        /// <summary>
        /// Resubmits a rejected translation request with an optional new file
        /// </summary>
        /// <param name="id">The ID of the request to resubmit</param>
        /// <param name="model">The resubmission data</param>
        /// <returns>The updated translation request</returns>
        [HttpPost("{id}/resubmit")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [RequestFormLimits(MultipartBodyLengthLimit = 10485760)] // 10MB
        public async Task<IActionResult> ResubmitRejectedRequest(Guid id, [FromForm] ResubmitRequestFormModel model)
        {
            // Validation
            if (string.IsNullOrWhiteSpace(model.UserComment))
            {
                return BadRequest("Comment explaining changes is required for resubmission");
            }
            
            // Handle file if provided
            byte[]? fileContent = null;
            string? originalFileName = null;
            
            if (model.File != null && model.File.Length > 0)
            {
                // Check file extension
                var fileExtension = Path.GetExtension(model.File.FileName).ToLowerInvariant();
                var allowedExtensions = new[] { ".txt", ".doc", ".docx", ".pdf" };
                
                if (!Array.Exists(allowedExtensions, ext => ext == fileExtension))
                {
                    return BadRequest("File type not supported. Allowed types: txt, doc, docx, pdf");
                }
                
                // Get file content
                using var memoryStream = new MemoryStream();
                await model.File.CopyToAsync(memoryStream);
                fileContent = memoryStream.ToArray();
                originalFileName = model.File.FileName;
            }
            
            // Resubmit the request
            var result = await _translationRequestService.ResubmitRequestAsync(
                id, 
                fileContent, 
                originalFileName, 
                model.UserComment, 
                GetUserId()
            );
            
            if (result == null)
            {
                return NotFound("Request not found or cannot be resubmitted. Only rejected requests can be resubmitted.");
            }
            
            return Ok(result);
        }
    }
    
    /// <summary>
    /// Model for creating a new translation request with file upload
    /// </summary>
    public class TranslationRequestFormModel
    {
        /// <summary>
        /// The title of the translation request
        /// </summary>
        public string Title { get; set; } = string.Empty;
        
        /// <summary>
        /// The description of the translation request
        /// </summary>
        public string Description { get; set; } = string.Empty;
        
        /// <summary>
        /// The source language of the document
        /// </summary>
        public string SourceLanguage { get; set; } = string.Empty;
        
        /// <summary>
        /// The target language for translation
        /// </summary>
        public string TargetLanguage { get; set; } = string.Empty;
        
        /// <summary>
        /// The file to be translated
        /// </summary>
        public IFormFile? File { get; set; }
        
        /// <summary>
        /// User comments on the translation request
        /// </summary>
        public string? UserComment { get; set; }
    }
    
    /// <summary>
    /// Model for updating an existing translation request
    /// </summary>
    public class TranslationRequestUpdateModel
    {
        /// <summary>
        /// The ID of the translation request
        /// </summary>
        public Guid Id { get; set; }
        
        /// <summary>
        /// The title of the translation request
        /// </summary>
        public string Title { get; set; } = string.Empty;
        
        /// <summary>
        /// The description of the translation request
        /// </summary>
        public string Description { get; set; } = string.Empty;
        
        /// <summary>
        /// The source language of the document
        /// </summary>
        public string SourceLanguage { get; set; } = string.Empty;
        
        /// <summary>
        /// The target language for translation
        /// </summary>
        public string TargetLanguage { get; set; } = string.Empty;
        
        /// <summary>
        /// User comments on the translation request
        /// </summary>
        public string? UserComment { get; set; }
    }
    
    /// <summary>
    /// Model for resubmitting a rejected translation request
    /// </summary>
    public class ResubmitRequestFormModel
    {
        /// <summary>
        /// Optional new file to submit for translation
        /// </summary>
        public IFormFile? File { get; set; }
        
        /// <summary>
        /// Comment explaining the changes made to address admin's rejection reason
        /// </summary>
        public string UserComment { get; set; } = string.Empty;
    }
}