using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Translator.API.Controllers;
using Translator.API.Models;
using Translator.API.Services;
using Xunit;

namespace Translator.Tests
{
    public class TranslationRequestControllerTests
    {
        private readonly Mock<ITranslationRequestService> _mockService;
        private readonly ClaimsPrincipal _user;
        private readonly string _userId = "test-user-id";

        public TranslationRequestControllerTests()
        {
            _mockService = new Mock<ITranslationRequestService>();

            // Setup ClaimsPrincipal for user authentication
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, _userId),
                new Claim(ClaimTypes.Name, "test@example.com"),
                new Claim(ClaimTypes.Role, "User")
            };

            var identity = new ClaimsIdentity(claims, "TestAuthType");
            _user = new ClaimsPrincipal(identity);
        }

        [Fact]
        public async Task GetUserRequests_ReturnsOkResultWithRequests()
        {
            // Arrange
            var requests = new List<TranslationRequest>
            {
                new TranslationRequest { Id = Guid.NewGuid(), Title = "Request 1", UserId = _userId },
                new TranslationRequest { Id = Guid.NewGuid(), Title = "Request 2", UserId = _userId }
            };

            _mockService.Setup(s => s.GetUserRequestsAsync(_userId))
                .ReturnsAsync(requests);

            var controller = new TranslationRequestController(_mockService.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = _user }
            };

            // Act
            var result = await controller.GetUserRequests();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnedRequests = Assert.IsAssignableFrom<IEnumerable<TranslationRequest>>(okResult.Value);
            Assert.Equal(2, ((List<TranslationRequest>)returnedRequests).Count);
        }

        [Fact]
        public async Task GetRequest_ExistingRequest_ReturnsOkResult()
        {
            // Arrange
            var requestId = Guid.NewGuid();
            var request = new TranslationRequest 
            { 
                Id = requestId, 
                Title = "Test Request", 
                UserId = _userId 
            };

            _mockService.Setup(s => s.GetRequestByIdAsync(requestId, _userId))
                .ReturnsAsync(request);

            var controller = new TranslationRequestController(_mockService.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = _user }
            };

            // Act
            var result = await controller.GetRequest(requestId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var returnedRequest = Assert.IsType<TranslationRequest>(okResult.Value);
            Assert.Equal(requestId, returnedRequest.Id);
            Assert.Equal("Test Request", returnedRequest.Title);
        }

        [Fact]
        public async Task GetRequest_NonExistingRequest_ReturnsNotFound()
        {
            // Arrange
            var requestId = Guid.NewGuid();

            _mockService.Setup(s => s.GetRequestByIdAsync(requestId, _userId))
                .ReturnsAsync((TranslationRequest)null);

            var controller = new TranslationRequestController(_mockService.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = _user }
            };

            // Act
            var result = await controller.GetRequest(requestId);

            // Assert
            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task UpdateRequest_ValidRequest_ReturnsOkResult()
        {
            // Arrange
            var requestId = Guid.NewGuid();
            var updateModel = new TranslationRequestUpdateModel
            {
                Id = requestId,
                Title = "Updated Title",
                Description = "Updated Description",
                SourceLanguage = "English",
                TargetLanguage = "French",
                UserComment = "Updated comment"
            };

            var updatedRequest = new TranslationRequest
            {
                Id = requestId,
                Title = "Updated Title",
                Description = "Updated Description",
                SourceLanguage = "English",
                TargetLanguage = "French",
                UserComment = "Updated comment",
                UserId = _userId
            };

            _mockService.Setup(s => s.UpdateRequestAsync(It.IsAny<TranslationRequest>(), _userId))
                .ReturnsAsync(updatedRequest);

            var controller = new TranslationRequestController(_mockService.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = _user }
            };

            // Act
            var result = await controller.UpdateRequest(requestId, updateModel);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedRequest = Assert.IsType<TranslationRequest>(okResult.Value);
            Assert.Equal(requestId, returnedRequest.Id);
            Assert.Equal("Updated Title", returnedRequest.Title);
            Assert.Equal("French", returnedRequest.TargetLanguage);
        }

        [Fact]
        public async Task UpdateRequest_IdMismatch_ReturnsBadRequest()
        {
            // Arrange
            var requestId = Guid.NewGuid();
            var differentId = Guid.NewGuid();
            var updateModel = new TranslationRequestUpdateModel
            {
                Id = differentId, // Different from route ID
                Title = "Updated Title"
            };

            var controller = new TranslationRequestController(_mockService.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = _user }
            };

            // Act
            var result = await controller.UpdateRequest(requestId, updateModel);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("ID mismatch", badRequestResult.Value);
        }

        [Fact]
        public async Task UpdateRequest_NonExistingRequest_ReturnsNotFound()
        {
            // Arrange
            var requestId = Guid.NewGuid();
            var updateModel = new TranslationRequestUpdateModel
            {
                Id = requestId,
                Title = "Updated Title"
            };

            _mockService.Setup(s => s.UpdateRequestAsync(It.IsAny<TranslationRequest>(), _userId))
                .ReturnsAsync((TranslationRequest)null);

            var controller = new TranslationRequestController(_mockService.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = _user }
            };

            // Act
            var result = await controller.UpdateRequest(requestId, updateModel);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Request not found or cannot be updated", notFoundResult.Value);
        }

        [Fact]
        public async Task DeleteRequest_ValidRequest_ReturnsNoContent()
        {
            // Arrange
            var requestId = Guid.NewGuid();

            _mockService.Setup(s => s.DeleteRequestAsync(requestId, _userId))
                .ReturnsAsync(true);

            var controller = new TranslationRequestController(_mockService.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = _user }
            };

            // Act
            var result = await controller.DeleteRequest(requestId);

            // Assert
            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task DeleteRequest_NonExistingRequest_ReturnsNotFound()
        {
            // Arrange
            var requestId = Guid.NewGuid();

            _mockService.Setup(s => s.DeleteRequestAsync(requestId, _userId))
                .ReturnsAsync(false);

            var controller = new TranslationRequestController(_mockService.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = _user }
            };

            // Act
            var result = await controller.DeleteRequest(requestId);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Request not found or cannot be deleted", notFoundResult.Value);
        }

        [Fact]
        public async Task DownloadOriginalFile_ValidRequest_ReturnsFileResult()
        {
            // Arrange
            var requestId = Guid.NewGuid();
            var request = new TranslationRequest
            {
                Id = requestId,
                OriginalFileName = "test.txt",
                StoredFileName = "stored-test.txt",
                UserId = _userId
            };

            byte[] fileContent = new byte[] { 1, 2, 3, 4, 5 };

            _mockService.Setup(s => s.GetRequestByIdAsync(requestId, _userId))
                .ReturnsAsync(request);
            _mockService.Setup(s => s.GetFileAsync("stored-test.txt"))
                .ReturnsAsync(fileContent);

            var controller = new TranslationRequestController(_mockService.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = _user }
            };

            // Act
            var result = await controller.DownloadOriginalFile(requestId);

            // Assert
            var fileResult = Assert.IsType<FileContentResult>(result);
            Assert.Equal("application/octet-stream", fileResult.ContentType);
            Assert.Equal("test.txt", fileResult.FileDownloadName);
            Assert.Equal(fileContent, fileResult.FileContents);
        }

        [Fact]
        public async Task DownloadOriginalFile_NonExistingRequest_ReturnsNotFound()
        {
            // Arrange
            var requestId = Guid.NewGuid();

            _mockService.Setup(s => s.GetRequestByIdAsync(requestId, _userId))
                .ReturnsAsync((TranslationRequest)null);

            var controller = new TranslationRequestController(_mockService.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = _user }
            };

            // Act
            var result = await controller.DownloadOriginalFile(requestId);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task DownloadTranslatedFile_WithValidCompletedRequest_ReturnsFileResult()
        {
            // Arrange
            var userId = "test-user-id";
            var requestId = Guid.NewGuid();
            var originalFileName = "document.txt";
            var translatedFileName = "translated.txt";
            var fileBytes = Encoding.UTF8.GetBytes("Translated content");
            
            var completedRequest = new TranslationRequest
            {
                Id = requestId,
                UserId = userId,
                Status = TranslationStatus.Completed,
                OriginalFileName = originalFileName,
                TranslatedFileName = translatedFileName
            };
            
            _mockService
                .Setup(s => s.GetRequestByIdAsync(requestId, userId))
                .ReturnsAsync(completedRequest);
                
            _mockService
                .Setup(s => s.GetFileAsync(translatedFileName))
                .ReturnsAsync(fileBytes);
                
            var controller = new TranslationRequestController(_mockService.Object);
            SetupUserContext(controller, userId);
            
            // Act
            var result = await controller.DownloadTranslatedFile(requestId);
            
            // Assert
            var fileResult = Assert.IsType<FileContentResult>(result);
            Assert.Equal("application/octet-stream", fileResult.ContentType);
            Assert.Equal($"Translated_{originalFileName}", fileResult.FileDownloadName);
            Assert.Equal(fileBytes, fileResult.FileContents);
        }
        
        [Fact]
        public async Task DownloadTranslatedFile_NonCompletedRequest_ReturnsBadRequest()
        {
            // Arrange
            var userId = "test-user-id";
            var requestId = Guid.NewGuid();
            
            var pendingRequest = new TranslationRequest
            {
                Id = requestId,
                UserId = userId,
                Status = TranslationStatus.Pending,
                OriginalFileName = "document.txt"
            };
            
            _mockService
                .Setup(s => s.GetRequestByIdAsync(requestId, userId))
                .ReturnsAsync(pendingRequest);
                
            var controller = new TranslationRequestController(_mockService.Object);
            SetupUserContext(controller, userId);
            
            // Act
            var result = await controller.DownloadTranslatedFile(requestId);
            
            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("not completed", badRequestResult.Value.ToString());
        }

        [Fact]
        public async Task ResubmitRejectedRequest_WithValidData_ReturnsOkResult()
        {
            // Arrange
            var userId = "test-user-id";
            var requestId = Guid.NewGuid();
            var userComment = "I've fixed the formatting issues";
            
            var mockFile = new Mock<IFormFile>();
            var content = "Updated content for translation";
            var fileName = "updated.txt";
            var ms = new MemoryStream();
            var writer = new StreamWriter(ms);
            writer.Write(content);
            writer.Flush();
            ms.Position = 0;
            mockFile.Setup(_ => _.OpenReadStream()).Returns(ms);
            mockFile.Setup(_ => _.FileName).Returns(fileName);
            mockFile.Setup(_ => _.Length).Returns(ms.Length);
            
            var resubmittedRequest = new TranslationRequest
            {
                Id = requestId,
                Title = "Test Request",
                Description = "Test Description",
                Status = TranslationStatus.Resubmitted,
                UserComment = userComment,
                OriginalFileName = fileName,
                UpdatedAt = DateTime.UtcNow
            };
            
            _mockService
                .Setup(s => s.ResubmitRequestAsync(
                    requestId,
                    It.IsAny<byte[]>(),
                    fileName,
                    userComment,
                    userId
                ))
                .ReturnsAsync(resubmittedRequest);
                
            var controller = new TranslationRequestController(_mockService.Object);
            SetupUserContext(controller, userId);
            
            var model = new ResubmitRequestFormModel
            {
                File = mockFile.Object,
                UserComment = userComment
            };
            
            // Act
            var result = await controller.ResubmitRejectedRequest(requestId, model);
            
            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsType<TranslationRequest>(okResult.Value);
            Assert.Equal(requestId, returnValue.Id);
            Assert.Equal(TranslationStatus.Resubmitted, returnValue.Status);
            Assert.Equal(userComment, returnValue.UserComment);
        }
        
        [Fact]
        public async Task ResubmitRejectedRequest_WithoutFile_ReturnsOkResult()
        {
            // Arrange
            var userId = "test-user-id";
            var requestId = Guid.NewGuid();
            var userComment = "I've clarified the requirements in my comment";
            
            var resubmittedRequest = new TranslationRequest
            {
                Id = requestId,
                Title = "Test Request",
                Description = "Test Description",
                Status = TranslationStatus.Resubmitted,
                UserComment = userComment,
                OriginalFileName = "original.txt",
                UpdatedAt = DateTime.UtcNow
            };
            
            _mockService
                .Setup(s => s.ResubmitRequestAsync(
                    requestId,
                    null,
                    null,
                    userComment,
                    userId
                ))
                .ReturnsAsync(resubmittedRequest);
                
            var controller = new TranslationRequestController(_mockService.Object);
            SetupUserContext(controller, userId);
            
            var model = new ResubmitRequestFormModel
            {
                File = null,
                UserComment = userComment
            };
            
            // Act
            var result = await controller.ResubmitRejectedRequest(requestId, model);
            
            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnValue = Assert.IsType<TranslationRequest>(okResult.Value);
            Assert.Equal(requestId, returnValue.Id);
            Assert.Equal(TranslationStatus.Resubmitted, returnValue.Status);
            Assert.Equal(userComment, returnValue.UserComment);
        }
        
        [Fact]
        public async Task ResubmitRejectedRequest_WithEmptyComment_ReturnsBadRequest()
        {
            // Arrange
            var userId = "test-user-id";
            var requestId = Guid.NewGuid();
            
            var controller = new TranslationRequestController(_mockService.Object);
            SetupUserContext(controller, userId);
            
            var model = new ResubmitRequestFormModel
            {
                File = null,
                UserComment = ""
            };
            
            // Act
            var result = await controller.ResubmitRejectedRequest(requestId, model);
            
            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("Comment", badRequestResult.Value.ToString());
        }
        
        [Fact]
        public async Task ResubmitRejectedRequest_WithInvalidFileType_ReturnsBadRequest()
        {
            // Arrange
            var userId = "test-user-id";
            var requestId = Guid.NewGuid();
            var userComment = "I've added a new file";
            
            var mockFile = new Mock<IFormFile>();
            var content = "Invalid file content";
            var fileName = "invalid.exe";
            var ms = new MemoryStream();
            var writer = new StreamWriter(ms);
            writer.Write(content);
            writer.Flush();
            ms.Position = 0;
            mockFile.Setup(_ => _.OpenReadStream()).Returns(ms);
            mockFile.Setup(_ => _.FileName).Returns(fileName);
            mockFile.Setup(_ => _.Length).Returns(ms.Length);
            
            var controller = new TranslationRequestController(_mockService.Object);
            SetupUserContext(controller, userId);
            
            var model = new ResubmitRequestFormModel
            {
                File = mockFile.Object,
                UserComment = userComment
            };
            
            // Act
            var result = await controller.ResubmitRejectedRequest(requestId, model);
            
            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Contains("File type not supported", badRequestResult.Value.ToString());
        }
        
        [Fact]
        public async Task ResubmitRejectedRequest_ServiceReturnsNull_ReturnsNotFound()
        {
            // Arrange
            var userId = "test-user-id";
            var requestId = Guid.NewGuid();
            var userComment = "I've fixed the issues";
            
            _mockService
                .Setup(s => s.ResubmitRequestAsync(
                    requestId,
                    null,
                    null,
                    userComment,
                    userId
                ))
                .ReturnsAsync((TranslationRequest)null);
                
            var controller = new TranslationRequestController(_mockService.Object);
            SetupUserContext(controller, userId);
            
            var model = new ResubmitRequestFormModel
            {
                File = null,
                UserComment = userComment
            };
            
            // Act
            var result = await controller.ResubmitRejectedRequest(requestId, model);
            
            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Contains("cannot be resubmitted", notFoundResult.Value.ToString());
        }

        private void SetupUserContext(TranslationRequestController controller, string userId)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Name, "test@example.com"),
                new Claim(ClaimTypes.Role, "User")
            };

            var identity = new ClaimsIdentity(claims, "TestAuthType");
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
            };
        }
    }
}