using System;

namespace Translator.API.Models
{
    /// <summary>
    /// Represents the status of a translation request
    /// </summary>
    public enum TranslationStatus
    {
        /// <summary>
        /// Request has been submitted and is pending admin review
        /// </summary>
        Pending = 0,
        
        /// <summary>
        /// Request has been approved by admin and is in progress
        /// </summary>
        Approved = 1,
        
        /// <summary>
        /// Request has been completed and the translated file is available
        /// </summary>
        Completed = 2,
        
        /// <summary>
        /// Request has been rejected by admin
        /// </summary>
        Rejected = 3,
        
        /// <summary>
        /// Request has been resubmitted after rejection
        /// </summary>
        Resubmitted = 4
    }
}