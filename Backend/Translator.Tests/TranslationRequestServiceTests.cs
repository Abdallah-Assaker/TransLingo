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
    public class TranslationRequestServiceTests : IDisposable
    {
        private readonly DbContextOptions<ApplicationDbContext> _options;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly string _tempPath;
        private readonly ApplicationDbContext _context;
        private readonly TranslationRequestService _service;

        public TranslationRequestServiceTests()
        {
            // Use SQLite in-memory database for testing
            _options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            // Setup temp path for file storage during tests
            _tempPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
            Directory.CreateDirectory(_tempPath);
            
            // Mock configuration to return our temp path
            _mockConfiguration = new Mock<IConfiguration>();
            _mockConfiguration.Setup(c => c["FileStorage:UploadPath"]).Returns(_tempPath);

            _context = new ApplicationDbContext(_options);
            _service = new TranslationRequestService(_context, _mockConfiguration.Object);
        }

        [Fact]
        public async Task CreateRequestAsync_ValidRequest_ReturnsCreatedRequest()
        {
            // Arrange
            var userId = "test-user-id";
            var request = new TranslationRequest
            {
                Title = "Test Translation",
                Description = "Test Description",
                SourceLanguage = "English",
                TargetLanguage = "Spanish",
                OriginalFileName = "test.txt",
                StoredFileName = "stored-test.txt"
            };

            // Act
            var result = await _service.CreateRequestAsync(request, userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Test Translation", result.Title);
            Assert.Equal(userId, result.UserId);
            Assert.Equal(TranslationStatus.Pending, result.Status);

            // Verify the request was saved to the database
            var savedRequest = await _context.TranslationRequests.FirstOrDefaultAsync();
            Assert.NotNull(savedRequest);
            Assert.Equal("Test Translation", savedRequest.Title);
            Assert.Equal(userId, savedRequest.UserId);
        }

        [Fact]
        public async Task GetUserRequestsAsync_ReturnsUserRequests()
        {
            // Arrange
            var userId = "test-user-id";
            var otherUserId = "other-user-id";
            
            using (var context = new ApplicationDbContext(_options))
            {
                // Add requests for two different users
                context.TranslationRequests.AddRange(
                    new TranslationRequest
                    {
                        Id = Guid.NewGuid(),
                        Title = "User Request 1",
                        UserId = userId,
                        SourceLanguage = "English",
                        TargetLanguage = "Spanish",
                        OriginalFileName = "test1.txt",
                        StoredFileName = "stored-test1.txt",
                        CreatedAt = DateTime.UtcNow.AddDays(-1)
                    },
                    new TranslationRequest
                    {
                        Id = Guid.NewGuid(),
                        Title = "User Request 2",
                        UserId = userId,
                        SourceLanguage = "English",
                        TargetLanguage = "French",
                        OriginalFileName = "test2.txt",
                        StoredFileName = "stored-test2.txt",
                        CreatedAt = DateTime.UtcNow
                    },
                    new TranslationRequest
                    {
                        Id = Guid.NewGuid(),
                        Title = "Other User Request",
                        UserId = otherUserId,
                        SourceLanguage = "English",
                        TargetLanguage = "German",
                        OriginalFileName = "other.txt",
                        StoredFileName = "stored-other.txt"
                    }
                );
                await context.SaveChangesAsync();
            }

            // Test with a clean context instance
            using (var context = new ApplicationDbContext(_options))
            {
                var service = new TranslationRequestService(context, _mockConfiguration.Object);

                // Act
                var result = await service.GetUserRequestsAsync(userId);

                // Assert
                var requests = result.ToList();
                Assert.Equal(2, requests.Count);
                Assert.All(requests, r => Assert.Equal(userId, r.UserId));
                // Verify they come back in order by CreatedAt (descending)
                Assert.Equal("User Request 2", requests[0].Title);
                Assert.Equal("User Request 1", requests[1].Title);
            }
        }

        [Fact]
        public async Task GetRequestByIdAsync_ValidRequest_ReturnsRequest()
        {
            // Arrange
            var userId = "test-user-id";
            var requestId = Guid.NewGuid();
            
            using (var context = new ApplicationDbContext(_options))
            {
                context.TranslationRequests.Add(new TranslationRequest
                {
                    Id = requestId,
                    Title = "Test Request",
                    UserId = userId,
                    SourceLanguage = "English",
                    TargetLanguage = "Spanish",
                    OriginalFileName = "test.txt",
                    StoredFileName = "stored-test.txt"
                });
                await context.SaveChangesAsync();
            }

            using (var context = new ApplicationDbContext(_options))
            {
                var service = new TranslationRequestService(context, _mockConfiguration.Object);

                // Act
                var result = await service.GetRequestByIdAsync(requestId, userId);

                // Assert
                Assert.NotNull(result);
                Assert.Equal(requestId, result.Id);
                Assert.Equal("Test Request", result.Title);
            }
        }

        [Fact]
        public async Task GetRequestByIdAsync_DifferentUser_ReturnsNull()
        {
            // Arrange
            var userId = "test-user-id";
            var otherUserId = "other-user-id";
            var requestId = Guid.NewGuid();
            
            using (var context = new ApplicationDbContext(_options))
            {
                context.TranslationRequests.Add(new TranslationRequest
                {
                    Id = requestId,
                    Title = "Test Request",
                    UserId = userId,
                    SourceLanguage = "English",
                    TargetLanguage = "Spanish",
                    OriginalFileName = "test.txt",
                    StoredFileName = "stored-test.txt"
                });
                await context.SaveChangesAsync();
            }

            using (var context = new ApplicationDbContext(_options))
            {
                var service = new TranslationRequestService(context, _mockConfiguration.Object);

                // Act - Try to get with different user ID
                var result = await service.GetRequestByIdAsync(requestId, otherUserId);

                // Assert
                Assert.Null(result);
            }
        }

        [Fact]
        public async Task UpdateRequestAsync_ValidRequest_ReturnsUpdatedRequest()
        {
            // Arrange
            var userId = "test-user-id";
            var requestId = Guid.NewGuid();
            
            using (var context = new ApplicationDbContext(_options))
            {
                context.TranslationRequests.Add(new TranslationRequest
                {
                    Id = requestId,
                    Title = "Original Title",
                    Description = "Original Description",
                    UserId = userId,
                    Status = TranslationStatus.Pending,
                    SourceLanguage = "English",
                    TargetLanguage = "Spanish",
                    OriginalFileName = "test.txt",
                    StoredFileName = "stored-test.txt"
                });
                await context.SaveChangesAsync();
            }

            using (var context = new ApplicationDbContext(_options))
            {
                var service = new TranslationRequestService(context, _mockConfiguration.Object);

                var updateRequest = new TranslationRequest
                {
                    Id = requestId,
                    Title = "Updated Title",
                    Description = "Updated Description",
                    SourceLanguage = "English",
                    TargetLanguage = "French", // Changed target language
                    UserComment = "Please translate to French instead"
                };

                // Act
                var result = await service.UpdateRequestAsync(updateRequest, userId);

                // Assert
                Assert.NotNull(result);
                Assert.Equal("Updated Title", result.Title);
                Assert.Equal("Updated Description", result.Description);
                Assert.Equal("French", result.TargetLanguage);
                Assert.Equal("Please translate to French instead", result.UserComment);
                Assert.NotNull(result.UpdatedAt);
            }
        }

        [Fact]
        public async Task UpdateRequestAsync_RejectedRequest_ChangesToResubmitted()
        {
            // Arrange
            var userId = "test-user-id";
            var requestId = Guid.NewGuid();
            
            using (var context = new ApplicationDbContext(_options))
            {
                context.TranslationRequests.Add(new TranslationRequest
                {
                    Id = requestId,
                    Title = "Rejected Request",
                    Description = "This was rejected",
                    UserId = userId,
                    Status = TranslationStatus.Rejected,
                    AdminComment = "Please clarify the target language",
                    SourceLanguage = "English",
                    TargetLanguage = "Spanish",
                    OriginalFileName = "test.txt",
                    StoredFileName = "stored-test.txt"
                });
                await context.SaveChangesAsync();
            }

            using (var context = new ApplicationDbContext(_options))
            {
                var service = new TranslationRequestService(context, _mockConfiguration.Object);

                var updateRequest = new TranslationRequest
                {
                    Id = requestId,
                    Title = "Rejected Request",
                    Description = "This was rejected but now updated",
                    SourceLanguage = "English",
                    TargetLanguage = "Spanish (Latin America)",
                    UserComment = "I want Latin American Spanish specifically"
                };

                // Act
                var result = await service.UpdateRequestAsync(updateRequest, userId);

                // Assert
                Assert.NotNull(result);
                Assert.Equal(TranslationStatus.Resubmitted, result.Status);
                Assert.Equal("Spanish (Latin America)", result.TargetLanguage);
            }
        }

        [Fact]
        public async Task DeleteRequestAsync_ValidRequest_ReturnsTrue()
        {
            // Arrange
            var userId = "test-user-id";
            var requestId = Guid.NewGuid();
            
            using (var context = new ApplicationDbContext(_options))
            {
                context.TranslationRequests.Add(new TranslationRequest
                {
                    Id = requestId,
                    Title = "Request to Delete",
                    UserId = userId,
                    Status = TranslationStatus.Pending,
                    SourceLanguage = "English",
                    TargetLanguage = "Spanish",
                    OriginalFileName = "test.txt",
                    StoredFileName = "stored-test.txt"
                });
                await context.SaveChangesAsync();
            }

            using (var context = new ApplicationDbContext(_options))
            {
                var service = new TranslationRequestService(context, _mockConfiguration.Object);

                // Act
                var result = await service.DeleteRequestAsync(requestId, userId);

                // Assert
                Assert.True(result);
            }

            // Verify it was deleted from database
            using (var context = new ApplicationDbContext(_options))
            {
                var request = await context.TranslationRequests.FindAsync(requestId);
                Assert.Null(request);
            }
        }

        [Fact]
        public async Task DeleteRequestAsync_ApprovedRequest_ReturnsFalse()
        {
            // Arrange
            var userId = "test-user-id";
            var requestId = Guid.NewGuid();
            
            using (var context = new ApplicationDbContext(_options))
            {
                context.TranslationRequests.Add(new TranslationRequest
                {
                    Id = requestId,
                    Title = "Approved Request",
                    UserId = userId,
                    Status = TranslationStatus.Approved, // Can't delete approved requests
                    SourceLanguage = "English",
                    TargetLanguage = "Spanish",
                    OriginalFileName = "test.txt",
                    StoredFileName = "stored-test.txt"
                });
                await context.SaveChangesAsync();
            }

            using (var context = new ApplicationDbContext(_options))
            {
                var service = new TranslationRequestService(context, _mockConfiguration.Object);

                // Act
                var result = await service.DeleteRequestAsync(requestId, userId);

                // Assert
                Assert.False(result);
            }

            // Verify it still exists in database
            using (var context = new ApplicationDbContext(_options))
            {
                var request = await context.TranslationRequests.FindAsync(requestId);
                Assert.NotNull(request);
            }
        }

        [Fact]
        public async Task SaveFileAsync_ValidFile_ReturnsStoredFileName()
        {
            // Arrange
            byte[] fileContent = new byte[] { 1, 2, 3, 4, 5 };
            string originalFileName = "test.txt";

            using (var context = new ApplicationDbContext(_options))
            {
                var service = new TranslationRequestService(context, _mockConfiguration.Object);

                // Act
                var storedFileName = await service.SaveFileAsync(fileContent, originalFileName);

                // Assert
                Assert.NotNull(storedFileName);
                Assert.EndsWith(".txt", storedFileName);
                
                // Verify file was saved
                var filePath = Path.Combine(_tempPath, storedFileName);
                Assert.True(File.Exists(filePath));
                
                // Verify content
                var savedContent = await File.ReadAllBytesAsync(filePath);
                Assert.Equal(fileContent, savedContent);
            }
        }

        [Fact]
        public async Task GetFileAsync_ExistingFile_ReturnsFileContent()
        {
            // Arrange
            byte[] fileContent = new byte[] { 5, 4, 3, 2, 1 };
            string storedFileName = $"{Guid.NewGuid()}.txt";
            var filePath = Path.Combine(_tempPath, storedFileName);
            
            // Create a test file
            await File.WriteAllBytesAsync(filePath, fileContent);

            using (var context = new ApplicationDbContext(_options))
            {
                var service = new TranslationRequestService(context, _mockConfiguration.Object);

                // Act
                var result = await service.GetFileAsync(storedFileName);

                // Assert
                Assert.Equal(fileContent, result);
            }
        }

        [Fact]
        public async Task GetFileAsync_NonExistentFile_ThrowsException()
        {
            // Arrange
            string nonExistentFileName = $"{Guid.NewGuid()}.txt";

            using (var context = new ApplicationDbContext(_options))
            {
                var service = new TranslationRequestService(context, _mockConfiguration.Object);

                // Act & Assert
                await Assert.ThrowsAsync<FileNotFoundException>(
                    async () => await service.GetFileAsync(nonExistentFileName));
            }
        }

        [Fact]
        public async Task ResubmitRequestAsync_WithValidData_ShouldUpdateStatusToResubmitted()
        {
            // Arrange
            var userId = "user1";
            var userComment = "I've fixed the formatting issues";
            
            // Create a rejected request to resubmit
            var request = new TranslationRequest
            {
                Title = "Test Request",
                Description = "Test Description",
                SourceLanguage = "English",
                TargetLanguage = "Spanish",
                UserComment = "Original Comment",
                Status = TranslationStatus.Rejected,
                AdminComment = "Fix document formatting",
                OriginalFileName = "original.txt",
                StoredFileName = "stored_original.txt"
            };
            
            var createdRequest = await _service.CreateRequestAsync(request, userId);
            
            // Mark it as rejected manually
            createdRequest.Status = TranslationStatus.Rejected;
            createdRequest.AdminComment = "Fix document formatting";
            await _context.SaveChangesAsync();
            
            // Create a test file to provide proper file cleanup
            var testFilePath = Path.Combine(_tempPath, createdRequest.StoredFileName);
            await File.WriteAllTextAsync(testFilePath, "Test content");
            
            // Act
            var fileContent = new byte[] { 1, 2, 3, 4, 5 };
            var originalFileName = "updated.txt";
            var result = await _service.ResubmitRequestAsync(
                createdRequest.Id, 
                fileContent, 
                originalFileName, 
                userComment, 
                userId
            );
            
            // Assert
            Assert.NotNull(result);
            Assert.Equal(TranslationStatus.Resubmitted, result.Status);
            Assert.Equal(userComment, result.UserComment);
            Assert.Equal(originalFileName, result.OriginalFileName);
            Assert.NotEqual("stored_original.txt", result.StoredFileName); // Should have a new stored file name
            Assert.NotNull(result.UpdatedAt);
            
            // The old file should be deleted
            Assert.False(File.Exists(testFilePath));
            
            // The new file should exist
            var newFilePath = Path.Combine(_tempPath, result.StoredFileName);
            Assert.True(File.Exists(newFilePath));
            
            // Cleanup
            if (File.Exists(newFilePath))
            {
                File.Delete(newFilePath);
            }
        }
        
        [Fact]
        public async Task ResubmitRequestAsync_WithoutNewFile_ShouldResubmitWithExistingFile()
        {
            // Arrange
            var userId = "user1";
            var userComment = "I've clarified the requirements";
            
            // Create a rejected request to resubmit
            var request = new TranslationRequest
            {
                Title = "Test Request",
                Description = "Test Description",
                SourceLanguage = "English",
                TargetLanguage = "Spanish",
                UserComment = "Original Comment",
                Status = TranslationStatus.Rejected,
                AdminComment = "Need more context",
                OriginalFileName = "original.txt",
                StoredFileName = "stored_original.txt"
            };
            
            var createdRequest = await _service.CreateRequestAsync(request, userId);
            
            // Mark it as rejected manually
            createdRequest.Status = TranslationStatus.Rejected;
            createdRequest.AdminComment = "Need more context";
            await _context.SaveChangesAsync();
            
            // Create a test file
            var testFilePath = Path.Combine(_tempPath, createdRequest.StoredFileName);
            await File.WriteAllTextAsync(testFilePath, "Test content");
            
            // Act
            var result = await _service.ResubmitRequestAsync(
                createdRequest.Id, 
                null, // No new file
                null, 
                userComment, 
                userId
            );
            
            // Assert
            Assert.NotNull(result);
            Assert.Equal(TranslationStatus.Resubmitted, result.Status);
            Assert.Equal(userComment, result.UserComment);
            Assert.Equal("original.txt", result.OriginalFileName); // Original file name should not change
            Assert.Equal("stored_original.txt", result.StoredFileName); // Should keep same stored file name
            Assert.NotNull(result.UpdatedAt);
            
            // The file should still exist
            Assert.True(File.Exists(testFilePath));
            
            // Cleanup
            if (File.Exists(testFilePath))
            {
                File.Delete(testFilePath);
            }
        }
        
        [Fact]
        public async Task ResubmitRequestAsync_WithInvalidId_ShouldReturnNull()
        {
            // Arrange
            var userId = "user1";
            var userComment = "I've fixed the issues";
            var invalidId = Guid.NewGuid();
            
            // Act
            var result = await _service.ResubmitRequestAsync(
                invalidId, 
                null, 
                null, 
                userComment, 
                userId
            );
            
            // Assert
            Assert.Null(result);
        }
        
        [Fact]
        public async Task ResubmitRequestAsync_WithNonRejectedRequest_ShouldReturnNull()
        {
            // Arrange
            var userId = "user1";
            var userComment = "I've fixed the issues";
            
            // Create a pending request (not rejected)
            var request = new TranslationRequest
            {
                Title = "Test Request",
                Description = "Test Description",
                SourceLanguage = "English",
                TargetLanguage = "Spanish",
                UserComment = "Original Comment",
                OriginalFileName = "original.txt",
                StoredFileName = "stored_original.txt"
            };
            
            var createdRequest = await _service.CreateRequestAsync(request, userId);
            
            // Act
            var result = await _service.ResubmitRequestAsync(
                createdRequest.Id, 
                null, 
                null, 
                userComment, 
                userId
            );
            
            // Assert
            Assert.Null(result);
        }
        
        [Fact]
        public async Task ResubmitRequestAsync_WithEmptyComment_ShouldThrowArgumentException()
        {
            // Arrange
            var userId = "user1";
            
            // Create a rejected request to resubmit
            var request = new TranslationRequest
            {
                Title = "Test Request",
                Description = "Test Description",
                SourceLanguage = "English",
                TargetLanguage = "Spanish",
                UserComment = "Original Comment",
                Status = TranslationStatus.Rejected,
                AdminComment = "Fix document formatting",
                OriginalFileName = "original.txt",
                StoredFileName = "stored_original.txt"
            };
            
            var createdRequest = await _service.CreateRequestAsync(request, userId);
            
            // Mark it as rejected manually
            createdRequest.Status = TranslationStatus.Rejected;
            createdRequest.AdminComment = "Fix document formatting";
            await _context.SaveChangesAsync();
            
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() => 
                _service.ResubmitRequestAsync(createdRequest.Id, null, null, "", userId)
            );
            
            await Assert.ThrowsAsync<ArgumentException>(() => 
                _service.ResubmitRequestAsync(createdRequest.Id, null, null, null, userId)
            );
        }
        
        [Fact]
        public async Task ResubmitRequestAsync_WithFileButNoFileName_ShouldThrowArgumentException()
        {
            // Arrange
            var userId = "user1";
            var userComment = "I've fixed the issues";
            var fileContent = new byte[] { 1, 2, 3, 4, 5 };
            
            // Create a rejected request to resubmit
            var request = new TranslationRequest
            {
                Title = "Test Request",
                Description = "Test Description",
                SourceLanguage = "English",
                TargetLanguage = "Spanish",
                UserComment = "Original Comment",
                Status = TranslationStatus.Rejected,
                AdminComment = "Fix document formatting",
                OriginalFileName = "original.txt",
                StoredFileName = "stored_original.txt"
            };
            
            var createdRequest = await _service.CreateRequestAsync(request, userId);
            
            // Mark it as rejected manually
            createdRequest.Status = TranslationStatus.Rejected;
            createdRequest.AdminComment = "Fix document formatting";
            await _context.SaveChangesAsync();
            
            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() => 
                _service.ResubmitRequestAsync(createdRequest.Id, fileContent, null, userComment, userId)
            );
            
            await Assert.ThrowsAsync<ArgumentException>(() => 
                _service.ResubmitRequestAsync(createdRequest.Id, fileContent, "", userComment, userId)
            );
        }

        public void Dispose()
        {
            // Clean up the database and file system after tests
            _context.Database.EnsureDeleted();
            _context.Dispose();

            // Delete the temporary directory and its files
            if (Directory.Exists(_tempPath))
            {
                Directory.Delete(_tempPath, true);
            }
        }
    }
}