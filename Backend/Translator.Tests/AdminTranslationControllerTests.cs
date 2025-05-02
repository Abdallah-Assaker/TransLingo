using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Translator.API.Controllers;
using Translator.API.Models;
using Translator.API.Services;
using Xunit;

namespace Translator.Tests
{
    public class AdminTranslationControllerTests
    {
        private readonly Mock<ITranslationRequestService> _mockTranslationService;
        private readonly TranslationController _controller;

        public AdminTranslationControllerTests()
        {
            _mockTranslationService = new Mock<ITranslationRequestService>();
            _controller = new TranslationController(_mockTranslationService.Object);
        }

        [Fact]
        public async Task GetAllRequests_ShouldReturnAllRequests()
        {
            // Arrange
            var requests = new List<TranslationRequest>
            {
                new TranslationRequest
                {
                    Id = Guid.NewGuid(),
                    Title = "Test Request 1",
                    Status = TranslationStatus.Pending
                },
                new TranslationRequest
                {
                    Id = Guid.NewGuid(),
                    Title = "Test Request 2",
                    Status = TranslationStatus.Approved
                }
            };

            _mockTranslationService.Setup(s => s.GetAllRequestsAsync())
                .ReturnsAsync(requests);

            // Act
            var result = await _controller.GetAllRequests();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnedRequests = Assert.IsAssignableFrom<IEnumerable<TranslationRequest>>(okResult.Value);
            Assert.Equal(2, returnedRequests.Count());
            
            // Verify service was called
            _mockTranslationService.Verify(s => s.GetAllRequestsAsync(), Times.Once);
        }

        [Fact]
        public async Task GetRequest_WithValidId_ShouldReturnRequest()
        {
            // Arrange
            var requestId = Guid.NewGuid();
            var request = new TranslationRequest
            {
                Id = requestId,
                Title = "Test Request",
                Status = TranslationStatus.Pending
            };

            _mockTranslationService.Setup(s => s.GetRequestByIdForAdminAsync(requestId))
                .ReturnsAsync(request);

            // Act
            var result = await _controller.GetRequest(requestId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnedRequest = Assert.IsType<TranslationRequest>(okResult.Value);
            Assert.Equal(requestId, returnedRequest.Id);
            
            // Verify service was called
            _mockTranslationService.Verify(s => s.GetRequestByIdForAdminAsync(requestId), Times.Once);
        }

        [Fact]
        public async Task GetRequest_WithInvalidId_ShouldReturnNotFound()
        {
            // Arrange
            var requestId = Guid.NewGuid();
            
            _mockTranslationService.Setup(s => s.GetRequestByIdForAdminAsync(requestId))
                .ReturnsAsync((TranslationRequest)null);

            // Act
            var result = await _controller.GetRequest(requestId);

            // Assert
            Assert.IsType<NotFoundResult>(result.Result);
            
            // Verify service was called
            _mockTranslationService.Verify(s => s.GetRequestByIdForAdminAsync(requestId), Times.Once);
        }

        [Fact]
        public async Task ApproveRequest_WithValidId_ShouldReturnUpdatedRequest()
        {
            // Arrange
            var requestId = Guid.NewGuid();
            var commentModel = new AdminCommentModel
            {
                Comment = "Approving this request"
            };
            
            var updatedRequest = new TranslationRequest
            {
                Id = requestId,
                Title = "Test Request",
                Status = TranslationStatus.Approved,
                AdminComment = commentModel.Comment
            };

            _mockTranslationService.Setup(s => s.ApproveRequestAsync(requestId, commentModel.Comment))
                .ReturnsAsync(updatedRequest);

            // Act
            var result = await _controller.ApproveRequest(requestId, commentModel);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedRequest = Assert.IsType<TranslationRequest>(okResult.Value);
            Assert.Equal(TranslationStatus.Approved, returnedRequest.Status);
            Assert.Equal(commentModel.Comment, returnedRequest.AdminComment);
            
            // Verify service was called
            _mockTranslationService.Verify(s => s.ApproveRequestAsync(requestId, commentModel.Comment), Times.Once);
        }

        [Fact]
        public async Task ApproveRequest_WithInvalidId_ShouldReturnNotFound()
        {
            // Arrange
            var requestId = Guid.NewGuid();
            var commentModel = new AdminCommentModel
            {
                Comment = "Approving this request"
            };
            
            _mockTranslationService.Setup(s => s.ApproveRequestAsync(requestId, commentModel.Comment))
                .ReturnsAsync((TranslationRequest)null);

            // Act
            var result = await _controller.ApproveRequest(requestId, commentModel);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Request not found or cannot be approved", notFoundResult.Value);
            
            // Verify service was called
            _mockTranslationService.Verify(s => s.ApproveRequestAsync(requestId, commentModel.Comment), Times.Once);
        }

        [Fact]
        public async Task RejectRequest_WithValidIdAndComment_ShouldReturnUpdatedRequest()
        {
            // Arrange
            var requestId = Guid.NewGuid();
            var commentModel = new AdminCommentModel
            {
                Comment = "Rejecting this request due to formatting issues"
            };
            
            var updatedRequest = new TranslationRequest
            {
                Id = requestId,
                Title = "Test Request",
                Status = TranslationStatus.Rejected,
                AdminComment = commentModel.Comment
            };

            _mockTranslationService.Setup(s => s.RejectRequestAsync(requestId, commentModel.Comment))
                .ReturnsAsync(updatedRequest);

            // Act
            var result = await _controller.RejectRequest(requestId, commentModel);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedRequest = Assert.IsType<TranslationRequest>(okResult.Value);
            Assert.Equal(TranslationStatus.Rejected, returnedRequest.Status);
            Assert.Equal(commentModel.Comment, returnedRequest.AdminComment);
            
            // Verify service was called
            _mockTranslationService.Verify(s => s.RejectRequestAsync(requestId, commentModel.Comment), Times.Once);
        }

        [Fact]
        public async Task RejectRequest_WithMissingComment_ShouldReturnBadRequest()
        {
            // Arrange
            var requestId = Guid.NewGuid();
            var commentModel = new AdminCommentModel
            {
                Comment = null // Missing required comment
            };

            // Act
            var result = await _controller.RejectRequest(requestId, commentModel);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Comment is required when rejecting a request", badRequestResult.Value);
            
            // Verify service was not called
            _mockTranslationService.Verify(s => s.RejectRequestAsync(It.IsAny<Guid>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task RejectRequest_WithInvalidId_ShouldReturnNotFound()
        {
            // Arrange
            var requestId = Guid.NewGuid();
            var commentModel = new AdminCommentModel
            {
                Comment = "Rejecting this request"
            };
            
            _mockTranslationService.Setup(s => s.RejectRequestAsync(requestId, commentModel.Comment))
                .ReturnsAsync((TranslationRequest)null);

            // Act
            var result = await _controller.RejectRequest(requestId, commentModel);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Request not found or cannot be rejected", notFoundResult.Value);
            
            // Verify service was called
            _mockTranslationService.Verify(s => s.RejectRequestAsync(requestId, commentModel.Comment), Times.Once);
        }

        [Fact]
        public async Task DownloadOriginalFile_WithValidId_ShouldReturnFile()
        {
            // Arrange
            var requestId = Guid.NewGuid();
            var request = new TranslationRequest
            {
                Id = requestId,
                Title = "Test Request",
                Status = TranslationStatus.Pending,
                OriginalFileName = "test.txt",
                StoredFileName = "stored_file.txt"
            };
            
            var fileContent = Encoding.UTF8.GetBytes("This is a test file content");

            _mockTranslationService.Setup(s => s.GetRequestByIdForAdminAsync(requestId))
                .ReturnsAsync(request);
                
            _mockTranslationService.Setup(s => s.GetFileAsync(request.StoredFileName))
                .ReturnsAsync(fileContent);

            // Act
            var result = await _controller.DownloadOriginalFile(requestId);

            // Assert
            var fileResult = Assert.IsType<FileContentResult>(result);
            Assert.Equal("application/octet-stream", fileResult.ContentType);
            Assert.Equal(request.OriginalFileName, fileResult.FileDownloadName);
            Assert.Equal(fileContent, fileResult.FileContents);
            
            // Verify service calls
            _mockTranslationService.Verify(s => s.GetRequestByIdForAdminAsync(requestId), Times.Once);
            _mockTranslationService.Verify(s => s.GetFileAsync(request.StoredFileName), Times.Once);
        }

        [Fact]
        public async Task DownloadOriginalFile_WithInvalidId_ShouldReturnNotFound()
        {
            // Arrange
            var requestId = Guid.NewGuid();
            
            _mockTranslationService.Setup(s => s.GetRequestByIdForAdminAsync(requestId))
                .ReturnsAsync((TranslationRequest)null);

            // Act
            var result = await _controller.DownloadOriginalFile(requestId);

            // Assert
            Assert.IsType<NotFoundResult>(result);
            
            // Verify service call
            _mockTranslationService.Verify(s => s.GetRequestByIdForAdminAsync(requestId), Times.Once);
            _mockTranslationService.Verify(s => s.GetFileAsync(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task DownloadTranslatedFile_WithValidIdAndCompletedRequest_ShouldReturnFile()
        {
            // Arrange
            var requestId = Guid.NewGuid();
            var request = new TranslationRequest
            {
                Id = requestId,
                Title = "Test Request",
                Status = TranslationStatus.Completed,
                OriginalFileName = "test.txt",
                TranslatedFileName = "translated_file.txt"
            };
            
            var fileContent = Encoding.UTF8.GetBytes("This is a translated file content");

            _mockTranslationService.Setup(s => s.GetRequestByIdForAdminAsync(requestId))
                .ReturnsAsync(request);
                
            _mockTranslationService.Setup(s => s.GetFileAsync(request.TranslatedFileName))
                .ReturnsAsync(fileContent);

            // Act
            var result = await _controller.DownloadTranslatedFile(requestId);

            // Assert
            var fileResult = Assert.IsType<FileContentResult>(result);
            Assert.Equal("application/octet-stream", fileResult.ContentType);
            Assert.Equal($"Translated_{request.OriginalFileName}", fileResult.FileDownloadName);
            Assert.Equal(fileContent, fileResult.FileContents);
            
            // Verify service calls
            _mockTranslationService.Verify(s => s.GetRequestByIdForAdminAsync(requestId), Times.Once);
            _mockTranslationService.Verify(s => s.GetFileAsync(request.TranslatedFileName), Times.Once);
        }

        [Fact]
        public async Task DownloadTranslatedFile_WithIncompleteRequest_ShouldReturnBadRequest()
        {
            // Arrange
            var requestId = Guid.NewGuid();
            var request = new TranslationRequest
            {
                Id = requestId,
                Title = "Test Request",
                Status = TranslationStatus.Approved, // Not completed
                OriginalFileName = "test.txt"
            };

            _mockTranslationService.Setup(s => s.GetRequestByIdForAdminAsync(requestId))
                .ReturnsAsync(request);

            // Act
            var result = await _controller.DownloadTranslatedFile(requestId);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Translation is not completed or translated file is not available", badRequestResult.Value);
            
            // Verify service calls
            _mockTranslationService.Verify(s => s.GetRequestByIdForAdminAsync(requestId), Times.Once);
            _mockTranslationService.Verify(s => s.GetFileAsync(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task CompleteRequest_WithValidIdAndFile_ShouldReturnUpdatedRequest()
        {
            // Arrange
            var requestId = Guid.NewGuid();
            var adminComment = "Translation completed";
            
            // Setup mock form file
            var content = "This is the translated content";
            var fileName = "translated.txt";
            var stream = new MemoryStream(Encoding.UTF8.GetBytes(content));
            var formFile = new FormFile(stream, 0, stream.Length, "file", fileName)
            {
                Headers = new HeaderDictionary(),
                ContentType = "text/plain"
            };
            
            var model = new TranslationCompletionModel
            {
                File = formFile,
                AdminComment = adminComment
            };
            
            var fileContent = Encoding.UTF8.GetBytes(content);
            
            var updatedRequest = new TranslationRequest
            {
                Id = requestId,
                Title = "Test Request",
                Status = TranslationStatus.Completed,
                AdminComment = adminComment,
                TranslatedFileName = "translated_stored.txt"
            };

            _mockTranslationService.Setup(s => s.CompleteRequestAsync(
                requestId, It.IsAny<byte[]>(), fileName, adminComment))
                .ReturnsAsync(updatedRequest);

            // Act
            var result = await _controller.CompleteRequest(requestId, model);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedRequest = Assert.IsType<TranslationRequest>(okResult.Value);
            Assert.Equal(TranslationStatus.Completed, returnedRequest.Status);
            Assert.Equal(adminComment, returnedRequest.AdminComment);
            
            // Verify service was called (we can't verify exact byte array content)
            _mockTranslationService.Verify(s => s.CompleteRequestAsync(
                requestId, It.IsAny<byte[]>(), fileName, adminComment), Times.Once);
        }

        [Fact]
        public async Task CompleteRequest_WithMissingFile_ShouldReturnBadRequest()
        {
            // Arrange
            var requestId = Guid.NewGuid();
            var model = new TranslationCompletionModel
            {
                File = null, // Missing file
                AdminComment = "Translation completed"
            };

            // Act
            var result = await _controller.CompleteRequest(requestId, model);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Translated file is required", badRequestResult.Value);
            
            // Verify service was not called
            _mockTranslationService.Verify(s => s.CompleteRequestAsync(
                It.IsAny<Guid>(), It.IsAny<byte[]>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task CompleteRequest_WithInvalidFileType_ShouldReturnBadRequest()
        {
            // Arrange
            var requestId = Guid.NewGuid();
            
            // Setup mock form file with invalid extension
            var content = "This is the translated content";
            var fileName = "translated.invalid";
            var stream = new MemoryStream(Encoding.UTF8.GetBytes(content));
            var formFile = new FormFile(stream, 0, stream.Length, "file", fileName)
            {
                Headers = new HeaderDictionary(),
                ContentType = "text/plain"
            };
            
            var model = new TranslationCompletionModel
            {
                File = formFile,
                AdminComment = "Translation completed"
            };

            // Act
            var result = await _controller.CompleteRequest(requestId, model);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("File type not supported. Allowed types: txt, doc, docx, pdf", badRequestResult.Value);
            
            // Verify service was not called
            _mockTranslationService.Verify(s => s.CompleteRequestAsync(
                It.IsAny<Guid>(), It.IsAny<byte[]>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }
    }
}