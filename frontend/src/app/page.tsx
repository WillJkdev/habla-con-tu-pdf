"use client";

import { AppHeader } from "@/components/AppHeader";
import { ChatInterface } from "@/components/ChatInterface";
import { DocumentManagement } from "@/components/DocumentManagement";
import { UploadSection } from "@/components/UploadSection";
import { usePDFChat } from "@/hooks/usePDFChat";

export default function PDFChatApp() {
  const {
    // State
    documents,
    isDragOver,
    searchQuery,
    sortBy,
    filterBy,
    chatMessages,
    currentMessage,
    selectedDocumentId,
    isTyping,
    isLoadingDocuments,
    readyDocuments,
    filteredAndSortedDocuments,

    // Refs
    chatScrollRef,

    // Actions
    setSearchQuery,
    setSortBy,
    setFilterBy,
    setCurrentMessage,
    handleDocumentChange,
    loadDocuments,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    deleteDocument,
    deleteAllDocuments,
    clearChat,
    clearAllHistory,
    handleDownloadDocument,
    handleSendMessage,
    handleKeyPress,
  } = usePDFChat();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <AppHeader />

        <div className="grid grid-cols-1 xl:grid-cols-1 gap-8">
          {/* Upload Section */}
          <UploadSection
            isDragOver={isDragOver}
            isLoadingDocuments={isLoadingDocuments}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onFileSelect={handleFileSelect}
          />

          {/* Document Management Panel */}
          <DocumentManagement
            documents={documents}
            filteredAndSortedDocuments={filteredAndSortedDocuments}
            isLoadingDocuments={isLoadingDocuments}
            searchQuery={searchQuery}
            sortBy={sortBy}
            filterBy={filterBy}
            onSearchChange={setSearchQuery}
            onSortChange={setSortBy}
            onFilterChange={setFilterBy}
            onLoadDocuments={loadDocuments}
            onDeleteAllDocuments={deleteAllDocuments}
            onDeleteDocument={deleteDocument}
            onDownloadDocument={handleDownloadDocument}
          />

          {/* Chat Interface */}
          <ChatInterface
            chatMessages={chatMessages}
            currentMessage={currentMessage}
            selectedDocumentId={selectedDocumentId}
            isTyping={isTyping}
            readyDocuments={readyDocuments}
            chatScrollRef={chatScrollRef}
            onMessageChange={setCurrentMessage}
            onDocumentChange={handleDocumentChange}
            onSendMessage={handleSendMessage}
            onKeyPress={handleKeyPress}
            onClearChat={clearChat}
            onClearAllHistory={clearAllHistory}
          />
        </div>
      </div>
    </div>
  );
}
