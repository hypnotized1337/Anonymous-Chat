import { memo } from 'react';
import { motion } from 'framer-motion';
import { getFileIcon, formatFileSize } from './FileHelpers';

interface FileAttachmentProps {
  fileName: string;
  fileSize?: number;
  fileMimeType?: string;
  isOwn: boolean;
  onInspect: () => void;
}

export const FileAttachment = memo(function FileAttachment({ fileName, fileSize, fileMimeType, isOwn, onInspect }: FileAttachmentProps) {
  const IconComponent = getFileIcon(fileMimeType, fileName);

  return (
    <motion.button
      onClick={onInspect}
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`flex items-center gap-2 p-3 rounded-lg transition-colors active:scale-[0.95] mb-1.5 w-full border
        ${isOwn
          ? 'border-black/15 hover:bg-black/10 text-message-own-foreground'
          : 'border-white/10 hover:bg-white/5 text-message-other-foreground'
        }`}
    >
      <IconComponent className="w-4 h-4 shrink-0 opacity-70 flex-none" />
      <span className="text-sm font-mono truncate flex-1 text-left font-medium">
        {fileName}
      </span>
      {fileSize != null && (
        <span className="text-xs opacity-50 flex-none ml-1 tabular-nums">
          {formatFileSize(fileSize)}
        </span>
      )}
    </motion.button>
  );
});
