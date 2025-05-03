using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Translator.API.DbContext;
using Translator.API.Models;
using Translator.API.Services;
using Xunit;

namespace Translator.Tests
{
    public class AdminTranslationRequestServiceTests : IDisposable
    {
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly TranslationRequestService _service;
        private readonly List<TranslationRequest> _requests;
        private readonly string _tempPath;
        private readonly ApplicationDbContext _dbContext;
        private readonly ApplicationUser _testUser;

        public AdminTranslationRequestServiceTests()
        {
            // Create a mock configuration
            _mockConfiguration = new Mock<IConfiguration>();
            
            // Setup test upload path
            _tempPath = Path.Combine(Path.GetTempPath(), "TranslatorTests", Guid.NewGuid().ToString());
            Directory.CreateDirectory(_tempPath);
            
            // Setup configuration to return test upload path
            _mockConfiguration.Setup(c => c["FileStorage:UploadPath"])
                .Returns(_tempPath);
            
            // Create a test user
            _testUser = new ApplicationUser
            {
                Id = "user123",
                UserName = "testuser@example.com",
                Email = "testuser@example.com",
                FirstName = "Test",
                LastName = "User"
            };
            
            // Setup test data with fixed GUIDs for better testability
            var request1Id = Guid.NewGuid();
            var request2Id = Guid.NewGuid();
            var request3Id = Guid.NewGuid();
            
            _requests = new List<TranslationRequest>
            {
                new TranslationRequest
                {
                    Id = request1Id,
                    Title = "Test Request 1",
                    Status = TranslationStatus.Pending,
                    UserId = _testUser.Id,
                    User = _testUser,
                    SourceLanguage = "English",
                    TargetLanguage = "Spanish",
                    CreatedAt = DateTime.UtcNow.AddDays(-2),
                    OriginalFileName = "test1.txt",
                    StoredFileName = "stored_test1.txt",
                    Description = "Test request 1 description"
                },
                new TranslationRequest
                {
                    Id = request2Id,
                    Title = "Test Request 2",
                    Status = TranslationStatus.Approved,
                    UserId = _testUser.Id,
                    User = _testUser,
                    SourceLanguage = "English",
                    TargetLanguage = "French",
                    CreatedAt = DateTime.UtcNow.AddDays(-1),
                    OriginalFileName = "test2.txt",
                    StoredFileName = "stored_test2.txt",
                    Description = "Test request 2 description"
                },
                new TranslationRequest
                {
                    Id = request3Id,
                    Title = "Test Request 3",
                    Status = TranslationStatus.Completed,
                    UserId = _testUser.Id,
                    User = _testUser,
                    SourceLanguage = "Spanish",
                    TargetLanguage = "English",
                    CreatedAt = DateTime.UtcNow,
                    CompletedAt = DateTime.UtcNow,
                    OriginalFileName = "test3.txt",
                    StoredFileName = "stored_test3.txt",
                    TranslatedFileName = "translated_test3.txt",
                    Description = "Test request 3 description"
                }
            };
            
            // Create a DbContext with in-memory database
            var dbName = $"TranslatorTestDb_{Guid.NewGuid()}";
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .EnableSensitiveDataLogging()
                .Options;
                
            _dbContext = new ApplicationDbContext(options);
            
            // Make sure the database is clean
            _dbContext.Database.EnsureDeleted();
            _dbContext.Database.EnsureCreated();
            
            // First add the user
            _dbContext.Users.Add(_testUser);
            _dbContext.SaveChanges();
            
            // Then add test data to the in-memory database and save immediately
            _dbContext.TranslationRequests.AddRange(_requests);
            _dbContext.SaveChanges();
            
            // Verify data was saved (for debugging)
            var count = _dbContext.TranslationRequests.Count();
            if (count != 3)
            {
                throw new Exception($"Test data was not properly added to the database. Expected 3 records, found {count}");
            }
            
            // Create the service with real DbContext but in-memory database
            _service = new TranslationRequestService(_dbContext, _mockConfiguration.Object);
        }

        [Fact]
        public async Task GetAllRequestsAsync_ShouldReturnAllRequests()
        {
            // Act
            var result = await _service.GetAllRequestsAsync();
            var resultList = result.ToList(); // Materialize the query results
            
            // Assert
            Assert.Equal(3, resultList.Count);
            Assert.Contains(resultList, r => r.Title == "Test Request 1");
            Assert.Contains(resultList, r => r.Title == "Test Request 2");
            Assert.Contains(resultList, r => r.Title == "Test Request 3");
        }

        [Fact]
        public async Task GetRequestByIdForAdminAsync_WithValidId_ShouldReturnRequest()
        {
            // Arrange
            var requestId = _requests[0].Id;
            
            // Act
            var result = await _service.GetRequestByIdForAdminAsync(requestId);
            
            // Assert
            Assert.NotNull(result);
            Assert.Equal(requestId, result.Id);
            Assert.Equal("Test Request 1", result.Title);
        }

        [Fact]
        public async Task GetRequestByIdForAdminAsync_WithInvalidId_ShouldReturnNull()
        {
            // Arrange
            var invalidId = Guid.NewGuid();
            
            // Act
            var result = await _service.GetRequestByIdForAdminAsync(invalidId);
            
            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task ApproveRequestAsync_WithValidPendingId_ShouldUpdateStatusToApproved()
        {
            // Arrange
            var requestId = _requests[0].Id;
            var adminComment = "Approved for translation";
            
            // Act
            var result = await _service.ApproveRequestAsync(requestId, adminComment);
            
            // Assert
            Assert.NotNull(result);
            Assert.Equal(TranslationStatus.Approved, result.Status);
            Assert.Equal(adminComment, result.AdminComment);
            Assert.NotNull(result.UpdatedAt);
            
            // Verify in database
            var updatedRequest = await _dbContext.TranslationRequests.FindAsync(requestId);
            Assert.NotNull(updatedRequest);
            Assert.Equal(TranslationStatus.Approved, updatedRequest.Status);
            Assert.Equal(adminComment, updatedRequest.AdminComment);
        }

        [Fact]
        public async Task ApproveRequestAsync_WithInvalidId_ShouldReturnNull()
        {
            // Arrange
            var invalidId = Guid.NewGuid();
            
            // Act
            var result = await _service.ApproveRequestAsync(invalidId, "Test comment");
            
            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task ApproveRequestAsync_WithNonPendingRequest_ShouldReturnNull()
        {
            // Arrange - use the completed request
            var completedRequestId = _requests[2].Id;
            
            // Act
            var result = await _service.ApproveRequestAsync(completedRequestId, "Test comment");
            
            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task RejectRequestAsync_WithValidPendingId_ShouldUpdateStatusToRejected()
        {
            // Arrange
            var requestId = _requests[0].Id;
            var adminComment = "Rejected due to formatting issues";
            
            // Act
            var result = await _service.RejectRequestAsync(requestId, adminComment);
            
            // Assert
            Assert.NotNull(result);
            Assert.Equal(TranslationStatus.Rejected, result.Status);
            Assert.Equal(adminComment, result.AdminComment);
            Assert.NotNull(result.UpdatedAt);
            
            // Verify in database
            var updatedRequest = await _dbContext.TranslationRequests.FindAsync(requestId);
            Assert.NotNull(updatedRequest);
            Assert.Equal(TranslationStatus.Rejected, updatedRequest.Status);
            Assert.Equal(adminComment, updatedRequest.AdminComment);
        }

        [Fact]
        public async Task RejectRequestAsync_WithEmptyComment_ShouldThrowArgumentException()
        {
            // Arrange
            var requestId = _requests[0].Id;
            
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() => _service.RejectRequestAsync(requestId, ""));
            await Assert.ThrowsAsync<ArgumentException>(() => _service.RejectRequestAsync(requestId, null));
        }

        [Fact]
        public async Task RejectRequestAsync_WithInvalidId_ShouldReturnNull()
        {
            // Arrange
            var invalidId = Guid.NewGuid();
            
            // Act
            var result = await _service.RejectRequestAsync(invalidId, "Test comment");
            
            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task CompleteRequestAsync_WithValidApprovedId_ShouldUpdateStatusToCompleted()
        {
            // Arrange
            var requestId = _requests[1].Id; // Approved request
            var adminComment = "Translation completed";
            var fileContent = new byte[] { 1, 2, 3, 4, 5 };
            var originalFileName = "translated.txt";
            
            // Create a test file to mock
            var testFilePath = Path.Combine(_tempPath, "stored_test2.txt");
            await File.WriteAllBytesAsync(testFilePath, new byte[] { 1, 2, 3 });
            
            // Act
            var result = await _service.CompleteRequestAsync(requestId, fileContent, originalFileName, adminComment);
            
            // Assert
            Assert.NotNull(result);
            Assert.Equal(TranslationStatus.Completed, result.Status);
            Assert.Equal(adminComment, result.AdminComment);
            Assert.NotNull(result.TranslatedFileName);
            Assert.NotNull(result.UpdatedAt);
            Assert.NotNull(result.CompletedAt);
            
            // Verify the file exists
            var translatedFilePath = Path.Combine(_tempPath, result.TranslatedFileName);
            Assert.True(File.Exists(translatedFilePath));
            
            // Verify the content was saved correctly
            var savedContent = await File.ReadAllBytesAsync(translatedFilePath);
            Assert.Equal(fileContent, savedContent);
            
            // Verify in database
            var updatedRequest = await _dbContext.TranslationRequests.FindAsync(requestId);
            Assert.NotNull(updatedRequest);
            Assert.Equal(TranslationStatus.Completed, updatedRequest.Status);
            Assert.Equal(adminComment, updatedRequest.AdminComment);
            Assert.NotNull(updatedRequest.TranslatedFileName);
            
            // Clean up the files
            if (File.Exists(testFilePath))
                File.Delete(testFilePath);
            
            if (File.Exists(translatedFilePath))
                File.Delete(translatedFilePath);
        }

        [Fact]
        public async Task CompleteRequestAsync_WithInvalidId_ShouldReturnNull()
        {
            // Arrange
            var invalidId = Guid.NewGuid();
            var fileContent = new byte[] { 1, 2, 3, 4, 5 };
            
            // Act
            var result = await _service.CompleteRequestAsync(invalidId, fileContent, "test.txt", "Test comment");
            
            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task CompleteRequestAsync_WithNonApprovedRequest_ShouldReturnNull()
        {
            // Arrange - use the pending request
            var pendingRequestId = _requests[0].Id;
            var fileContent = new byte[] { 1, 2, 3, 4, 5 };
            
            // Act
            var result = await _service.CompleteRequestAsync(pendingRequestId, fileContent, "test.txt", "Test comment");
            
            // Assert
            Assert.Null(result);
        }
        
        // Implement the IDisposable interface to clean up resources
        public void Dispose()
        {
            // Clean up the temp directory
            if (Directory.Exists(_tempPath))
            {
                try
                {
                    Directory.Delete(_tempPath, true);
                }
                catch
                {
                    // Ignore cleanup errors
                }
            }
            
            // Dispose the DbContext
            _dbContext.Dispose();
        }
    }
}