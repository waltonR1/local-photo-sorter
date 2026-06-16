export {}

declare global {
  interface Window {
    showDirectoryPicker?: (options?: {
      mode?: 'read' | 'readwrite'
    }) => Promise<FileSystemDirectoryHandle>

    showOpenFilePicker?: (options?: {
      multiple?: boolean
      types?: Array<{
        description?: string
        accept: Record<string, string[]>
      }>
      excludeAcceptAllOption?: boolean
    }) => Promise<FileSystemFileHandle[]>
  }

  interface FileSystemHandle {
    kind: 'file' | 'directory'
    name: string

    queryPermission?: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>

    requestPermission?: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>
  }

  interface FileSystemDirectoryHandle extends FileSystemHandle {
    kind: 'directory'
    getDirectoryHandle(
      name: string,
      options?: { create?: boolean },
    ): Promise<FileSystemDirectoryHandle>
    getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>
    removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>
    values(): AsyncIterableIterator<FileSystemHandle>
  }

  interface FileSystemFileHandle extends FileSystemHandle {
    kind: 'file'
    getFile(): Promise<File>
    createWritable(): Promise<FileSystemWritableFileStream>
  }

  interface FileSystemWritableFileStream extends WritableStream {
    write(data: BufferSource | Blob | string): Promise<void>
    close(): Promise<void>
  }
}
