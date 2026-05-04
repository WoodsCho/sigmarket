import { useRef, useState } from "react"
import { ImagePlus, X, Loader2, AlertCircle } from "lucide-react"
import { fetchAuthSession } from "aws-amplify/auth"

const API_URL = import.meta.env.VITE_INDICATORS_API_URL
  || (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/indicator` : "")

interface ImageUploaderProps {
  value?: string           // 현재 이미지 URL
  onChange: (url: string) => void
  label?: string
  className?: string
}

export default function ImageUploader({ value, onChange, label = "이미지 업로드", className = "" }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [dragOver, setDragOver] = useState(false)

  const upload = async (file: File) => {
    setError("")
    setUploading(true)
    try {
      // 1. 관리자 토큰 가져오기
      const session = await fetchAuthSession()
      const token = session.tokens?.idToken?.toString() || ""

      // 2. Lambda에서 presigned URL 발급
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          _action: "upload-url",
          fileName: file.name,
          fileType: file.type,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "presigned URL 발급 실패")
      }

      const { uploadUrl, publicUrl } = await res.json()
      console.log("[ImageUploader] publicUrl:", publicUrl)

      // 3. S3에 직접 업로드 (presigned PUT)
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })

      if (!uploadRes.ok) throw new Error("S3 업로드 실패")

      // 4. 완료 → URL 전달
      onChange(publicUrl)
    } catch (err: any) {
      setError(err.message || "업로드 실패")
    } finally {
      setUploading(false)
    }
  }

  const handleFile = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드 가능합니다.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("파일 크기는 10MB 이하여야 합니다.")
      return
    }
    upload(file)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="block text-xs text-gray-500">{label}</label>}

      {/* 현재 이미지 미리보기 */}
      {value && (
        <div className="relative group w-full h-40 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700">
          <img src={value} alt="preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 업로드 영역 */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFile(e.dataTransfer.files[0])
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`
          flex flex-col items-center justify-center gap-2 w-full py-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors
          ${dragOver ? "border-cyan-400 bg-cyan-500/10" : "border-zinc-700 hover:border-zinc-500 bg-zinc-900/50"}
          ${uploading ? "cursor-not-allowed opacity-60" : ""}
        `}
      >
        {uploading ? (
          <>
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            <span className="text-xs text-gray-400">업로드 중...</span>
          </>
        ) : (
          <>
            <ImagePlus className="w-5 h-5 text-gray-500" />
            <span className="text-xs text-gray-400">
              클릭하거나 이미지를 드래그하세요
            </span>
            <span className="text-[10px] text-gray-600">JPG, PNG, WEBP · 최대 10MB</span>
          </>
        )}
      </div>

      {/* 에러 */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
