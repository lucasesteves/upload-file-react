import { useState, useEffect } from 'react'
import Dropzone from 'react-dropzone'
import { sendUpload } from "./server"

const chunkSize = 1 * 1024 * 1024;

function App() {
  const [files, setFiles] = useState<any>([])
  const [currentFileIndex, setCurrentFileIndex] = useState<any>(null);
  const [lastUploadedFileIndex, setLastUploadedFileIndex] = useState(null)
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(-1)
  const [filesname, setFilesname] = useState<any>([])

  const handleDrop = (selectedFiles: any) => {
    setFiles([...files, ...selectedFiles])
  }

  useEffect(() => {
    if (files.length > 0) {
      if (currentFileIndex === null) {
        setCurrentFileIndex(lastUploadedFileIndex === null ? 0 : lastUploadedFileIndex + 1)
      }
    }
  }, [files.length])

  useEffect(() => {
    if (currentFileIndex !== null) {
      setCurrentChunkIndex(0);
    }
  }, [currentFileIndex]);

  useEffect(() => {
    if (currentChunkIndex !== null) {
      handleUploadFile();
    }
  }, [currentChunkIndex]);

  useEffect(() => {
    if (lastUploadedFileIndex === null) {
      return;
    }
    const isLastFile = lastUploadedFileIndex === files.length - 1;
    const nextFileIndex = isLastFile ? null : currentFileIndex + 1;
    setCurrentFileIndex(nextFileIndex);
  }, [lastUploadedFileIndex]);

  const handleUploadFile = () => {
    const reader = new FileReader()
    const file = files[currentFileIndex]
    if (!file) {
      return;
    }
    const from = currentChunkIndex * chunkSize
    const to = from + chunkSize;
    const blob = file.slice(from, to)
    reader.onload = (e: any) => {
      const file = files[currentFileIndex]
      const data = e.target.result
      const body = {
        name: file.name,
        size: file.size,
        currentChunkIndex,
        totalChunks: Math.ceil(file.size / chunkSize),
        data
      }
      sendUpload(body).then(response => {
        const filesize = files[currentFileIndex].size;
        const chunks = Math.ceil(filesize / chunkSize) - 1;
        const isLastChunk = currentChunkIndex === chunks;
        if (isLastChunk) {
          const finalName = { finalFileName: response?.finalFilename, index: currentFileIndex }
          setFilesname([...filesname, finalName])
          setLastUploadedFileIndex(currentFileIndex);
          setCurrentChunkIndex(-1);
        } else {
          setCurrentChunkIndex(currentChunkIndex + 1);
        }
      })
    };
    reader.readAsDataURL(blob)
  }

  return (
    <section className="drop-container">
      <Dropzone onDrop={acceptedFiles => handleDrop(acceptedFiles)} >
        {({ getRootProps, getInputProps, isDragActive }) => (
          <section>
            <div {...getRootProps({ className: "dropzone drop-card disabled" })}>
              <input {...getInputProps()} />
              {isDragActive ? (
                <p>Drop the image here...</p>
              ) : (
                <p>Drag and drop an image here, or click to select one</p>
              )}
            </div>
          </section>
        )}
      </Dropzone>

      <div className="files-container">
        {files.map((file: File, fileIndex: number) => {
          let progress = 0;
          if (!!filesname && filesname[fileIndex]?.finalFileName) {
            progress = 100;
          }
          else {
            const uploading = fileIndex === currentFileIndex;
            const chunks = Math.ceil(file.size / chunkSize);
            if (uploading) {
              progress = Math.round(currentChunkIndex / chunks * 100);
            } else {
              progress = 0;
            }
          }
          return (
            <a className="file" target="_blank" href={!!filesname ? 'http://localhost:4000/uploads/' + filesname[fileIndex]?.finalFileName : ""}>
              <div className="name">{file.name}</div>
              <div style={{ width: progress + "%", marginLeft: 12 }}>{progress}%</div>
            </a>
          );
        })}
      </div>
    </section>
  )
}

export default App
