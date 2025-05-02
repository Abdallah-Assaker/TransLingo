using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Translator.API.Models;
using Translator.API.Services;

namespace Translator.API.Controllers
{
    /// <summary>
    /// Controller for managing translation requests by administrators
    /// </summary>
    [ApiController]
    [Route("api/admin/[controller]")]
    [Authorize(Roles = "Admin")]
    public class TranslationController : ControllerBase
    {
        private readonly ITranslationRequestService _translationRequestService;
        
        /// <summary>
        /// Initializes a new instance of the AdminTranslationController
        /// </summary>
        /// <param name="translationRequestService">The translation request service</param>
        public TranslationController(ITranslationRequestService translationRequestService)
        {
            _translationRequestService = translationRequestService;
        }
        
        /// <summary>
        /// Gets all translation requests in the system
        /// </summary>
        /// <returns>A list of all translation requests</returns>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<TranslationRequest>>> GetAllRequests()
        {
            var requests = await _translationRequestService.GetAllRequestsAsync();
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
            var request = await _translationRequestService.GetRequestByIdForAdminAsync(id);
            
            if (request == null)
            {
                return NotFound();
            }
            
            return Ok(request);
        }
        
        /// <summary>
        /// Approves a translation request
        /// </summary>
        /// <param name="id">The ID of the request to approve</param>
        /// <param name="model">The approval model with optional comment</param>
        /// <returns>The updated translation request</returns>
        [HttpPost("{id}/approve")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ApproveRequest(Guid id, [FromBody] AdminCommentModel model)
        {
            var updatedRequest = await _translationRequestService.ApproveRequestAsync(id, model.Comment);
            
            if (updatedRequest == null)
            {
                return NotFound("Request not found or cannot be approved");
            }
            
            return Ok(updatedRequest);
        }
        
        /// <summary>
        /// Rejects a translation request
        /// </summary>
        /// <param name="id">The ID of the request to reject</param>
        /// <param name="model">The rejection model with required comment</param>
        /// <returns>The updated translation request</returns>
        [HttpPost("{id}/reject")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> RejectRequest(Guid id, [FromBody] AdminCommentModel model)
        {
            if (string.IsNullOrWhiteSpace(model.Comment))
            {
                return BadRequest("Comment is required when rejecting a request");
            }
            
            var updatedRequest = await _translationRequestService.RejectRequestAsync(id, model.Comment);
            
            if (updatedRequest == null)
            {
                return NotFound("Request not found or cannot be rejected");
            }
            
            return Ok(updatedRequest);
        }
        
        /// <summary>
        /// Completes a translation request with the translated file
        /// </summary>
        /// <param name="id">The ID of the request to complete</param>
        /// <param name="model">The form data with the translated file and optional comment</param>
        /// <returns>The updated translation request</returns>
        [HttpPost("{id}/complete")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [RequestFormLimits(MultipartBodyLengthLimit = 10485760)] // 10MB
        public async Task<IActionResult> CompleteRequest(Guid id, [FromForm] TranslationCompletionModel model)
        {
            if (model.File == null || model.File.Length == 0)
            {
                return BadRequest("Translated file is required");
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
            
            var updatedRequest = await _translationRequestService.CompleteRequestAsync(
                id, fileContent, model.File.FileName, model.AdminComment);
            
            if (updatedRequest == null)
            {
                return NotFound("Request not found or cannot be completed");
            }
            
            return Ok(updatedRequest);
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
            var request = await _translationRequestService.GetRequestByIdForAdminAsync(id);
            
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
            var request = await _translationRequestService.GetRequestByIdForAdminAsync(id);
            
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
    }
    
    /// <summary>
    /// Model for admin comments on translation requests
    /// </summary>
    public class AdminCommentModel
    {
        /// <summary>
        /// The admin's comment on the translation request
        /// </summary>
        public string? Comment { get; set; }
    }
    
    /// <summary>
    /// Model for completing a translation request with the translated file
    /// </summary>
    public class TranslationCompletionModel
    {
        /// <summary>
        /// The translated file
        /// </summary>
        public IFormFile? File { get; set; }
        
        /// <summary>
        /// Optional admin comment on the translation
        /// </summary>
        public string? AdminComment { get; set; }
    }
}