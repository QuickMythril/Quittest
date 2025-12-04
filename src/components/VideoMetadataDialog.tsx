import {
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';
import { styled } from '@mui/system';
import { useState, useEffect, useRef } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { generateVideoExtracts, compressImage } from '../utils/videoUtils';
import { categories, subCategories } from '../constants/Categories';
import { TextEditor } from './common/TextEditor';
import qtubeLogoImg from '../assets/images/qtube.webp';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    maxWidth: '600px',
    width: '100%',
    borderRadius: theme.spacing(3),
    margin: theme.spacing(2),
    overflow: 'visible',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 24px 48px rgba(0, 0, 0, 0.5)'
        : '0 24px 48px rgba(0, 0, 0, 0.15)',
    border: `1px solid ${theme.palette.divider}`,
    background: theme.palette.background.paper,
  },
  '& .MuiBackdrop-root': {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(0, 0, 0, 0.7)'
        : 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(8px)',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2.5, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
  fontWeight: 700,
  fontSize: '20px',
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(29, 155, 240, 0.1), rgba(120, 86, 255, 0.1))'
      : 'linear-gradient(135deg, rgba(29, 155, 240, 0.05), rgba(120, 86, 255, 0.05))',
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2.5),
  overflow: 'auto',
  maxHeight: '80vh',
}));

const VideoPreviewContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '300px',
  minHeight: '300px',
  maxHeight: '300px',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  backgroundColor: theme.palette.background.default,
  border: `2px solid ${theme.palette.divider}`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 4px 12px rgba(0, 0, 0, 0.3)'
      : '0 4px 12px rgba(0, 0, 0, 0.08)',
  flexShrink: 0, // Prevent shrinking
}));

const VideoPreview = styled('video')({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
});

const ButtonContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  justifyContent: 'flex-end',
  paddingTop: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const ActionButton = styled('button')<{ variant?: 'primary' | 'secondary' }>(
  ({ theme, variant = 'secondary' }) => ({
    background:
      variant === 'primary'
        ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
        : theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(0, 0, 0, 0.04)',
    color: variant === 'primary' ? '#fff' : theme.palette.text.primary,
    border: 'none',
    borderRadius: '24px',
    padding: '10px 24px',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    boxShadow:
      variant === 'primary'
        ? theme.palette.mode === 'dark'
          ? '0 4px 12px rgba(29, 155, 240, 0.3)'
          : '0 4px 12px rgba(29, 155, 240, 0.25)'
        : 'none',
    '&:hover': {
      transform: 'translateY(-2px) scale(1.02)',
      boxShadow:
        variant === 'primary'
          ? theme.palette.mode === 'dark'
            ? '0 6px 20px rgba(29, 155, 240, 0.4)'
            : '0 6px 20px rgba(29, 155, 240, 0.35)'
          : theme.palette.mode === 'dark'
            ? '0 2px 8px rgba(255, 255, 255, 0.1)'
            : '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    '&:active': {
      transform: 'translateY(0) scale(0.98)',
    },
  })
);

const InfoText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '14px',
  fontStyle: 'italic',
}));

const ThumbnailSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
}));

const ThumbnailGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: theme.spacing(1),
}));

const ThumbnailOption = styled(Box)<{ selected?: boolean }>(
  ({ theme, selected }) => ({
    position: 'relative',
    paddingBottom: '75%', // 4:3 aspect ratio
    borderRadius: theme.spacing(1),
    overflow: 'hidden',
    cursor: 'pointer',
    border: selected
      ? `3px solid ${theme.palette.primary.main}`
      : `2px solid ${theme.palette.divider}`,
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.05)',
      borderColor: theme.palette.primary.main,
    },
  })
);

const ThumbnailImage = styled('img')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

const CustomThumbnailOption = styled(Box)<{ selected?: boolean }>(
  ({ theme, selected }) => ({
    position: 'relative',
    paddingBottom: '75%',
    borderRadius: theme.spacing(1),
    overflow: 'hidden',
    cursor: 'pointer',
    border: selected
      ? `3px solid ${theme.palette.primary.main}`
      : `2px dashed ${theme.palette.divider}`,
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.02)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.05)',
      borderColor: theme.palette.primary.main,
      backgroundColor:
        theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(0, 0, 0, 0.04)',
    },
  })
);

const CustomThumbnailContent = styled(Box)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
});

const SelectedBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(0.5),
  right: theme.spacing(0.5),
  backgroundColor: theme.palette.primary.main,
  color: '#fff',
  borderRadius: '50%',
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  fontWeight: 700,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
}));

export interface VideoMetadata {
  title: string;
  description: string;
  duration?: number;
  videoImage?: string; // Compressed base64 image
  extracts?: string[]; // 4 compressed base64 images
  category: number; // Required
  subcategory?: number;
}

interface VideoMetadataDialogProps {
  open: boolean;
  videoFile: File | null;
  videoPreview: string | null;
  onConfirm: (metadata: VideoMetadata) => void;
  onCancel: () => void;
}

export function VideoMetadataDialog({
  open,
  videoFile,
  videoPreview,
  onConfirm,
  onCancel,
}: VideoMetadataDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [extractedFrames, setExtractedFrames] = useState<string[]>([]);
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState<
    number | null
  >(0); // 0-3 for extracted frames, -1 for custom
  const [customThumbnail, setCustomThumbnail] = useState<string | null>(null);
  const [isExtractingFrames, setIsExtractingFrames] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when dialog opens with new video
  useEffect(() => {
    if (open && videoFile) {
      setTitle('');
      setDescription('');
      setDuration(undefined);
      setExtractedFrames([]);
      setSelectedThumbnailIndex(0);
      setCustomThumbnail(null);
      setSelectedCategory(null);
      setSelectedSubCategory(null);
      setIsExtractingFrames(true);

      // Extract frames from video
      generateVideoExtracts(videoFile)
        .then(async (result) => {
          setDuration(Math.floor(result.duration));

          // Compress all extracted frames
          const compressedFrames = await Promise.all(
            result.extracts.map((frame) => compressImage(frame))
          );

          setExtractedFrames(compressedFrames);
          setIsExtractingFrames(false);
        })
        .catch((error) => {
          console.error('Error extracting frames:', error);
          setIsExtractingFrames(false);
        });
    }
  }, [open, videoFile]);

  const handleCustomThumbnailSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Read file as data URL
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;

        // Compress the custom thumbnail
        const compressed = await compressImage(dataUrl);
        setCustomThumbnail(compressed);
        setSelectedThumbnailIndex(-1); // -1 indicates custom thumbnail
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing custom thumbnail:', error);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleThumbnailSelect = (index: number) => {
    setSelectedThumbnailIndex(index);
  };

  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    const categoryId = event.target.value;
    const category = categories.find((cat) => cat.id === +categoryId);
    setSelectedCategory(category || null);
    setSelectedSubCategory(null); // Reset subcategory when category changes
  };

  const handleSubCategoryChange = (event: SelectChangeEvent<string>) => {
    const subcategoryId = event.target.value;
    if (selectedCategory && subCategories[selectedCategory.id]) {
      const subcategory = subCategories[selectedCategory.id].find(
        (subcat) => subcat.id === +subcategoryId
      );
      setSelectedSubCategory(subcategory || null);
    }
  };

  const handleConfirm = () => {
    if (title.trim() && selectedCategory) {
      // Determine which image to use as videoImage
      let videoImage: string | undefined;
      if (selectedThumbnailIndex === -1 && customThumbnail) {
        videoImage = customThumbnail;
      } else if (
        selectedThumbnailIndex !== null &&
        selectedThumbnailIndex >= 0 &&
        extractedFrames[selectedThumbnailIndex]
      ) {
        videoImage = extractedFrames[selectedThumbnailIndex];
      }

      onConfirm({
        title: title.trim(),
        description: description.trim(),
        duration,
        videoImage,
        extracts: extractedFrames,
        category: selectedCategory.id,
        subcategory: selectedSubCategory?.id,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setDuration(undefined);
      setExtractedFrames([]);
      setSelectedThumbnailIndex(0);
      setCustomThumbnail(null);
      setSelectedCategory(null);
      setSelectedSubCategory(null);
    }
  };

  const handleCancel = () => {
    onCancel();
    // Reset form
    setTitle('');
    setDescription('');
    setDuration(undefined);
    setExtractedFrames([]);
    setSelectedThumbnailIndex(0);
    setCustomThumbnail(null);
    setSelectedCategory(null);
    setSelectedSubCategory(null);
  };

  const isFormValid = title.trim().length > 0 && selectedCategory !== null;

  // Determine the current poster image for the video preview
  const videoPoster = (() => {
    if (selectedThumbnailIndex === -1 && customThumbnail) {
      return customThumbnail;
    } else if (
      selectedThumbnailIndex !== null &&
      selectedThumbnailIndex >= 0 &&
      extractedFrames[selectedThumbnailIndex]
    ) {
      return extractedFrames[selectedThumbnailIndex];
    }
    return undefined;
  })();

  return (
    <StyledDialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <StyledDialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            component="img"
            src={qtubeLogoImg}
            alt="Q-Tube"
            sx={{
              height: 32,
              width: 32,
              objectFit: 'contain',
            }}
          />
          <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
            Q-Tube video data
          </Typography>
        </Box>
      </StyledDialogTitle>
      <StyledDialogContent>
        {videoPreview && (
          <VideoPreviewContainer>
            <VideoPreview src={videoPreview} poster={videoPoster} controls />
          </VideoPreviewContainer>
        )}

        <Box>
          <TextField
            label="Video Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            placeholder="Enter a title for your video"
            variant="outlined"
            inputProps={{ maxLength: 100 }}
            helperText={`${title.length}/100 characters`}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                },
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderWidth: '2px',
                  },
                },
              },
            }}
          />
        </Box>

        <Box>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            Description (Optional)
          </Typography>
          <TextEditor
            inlineContent={description}
            setInlineContent={(value: string) => {
              setDescription(value);
            }}
          />
        </Box>

        <FormControl fullWidth required>
          <InputLabel id="video-category-label">Category *</InputLabel>
          <Select
            labelId="video-category-label"
            value={selectedCategory?.id?.toString() || ''}
            onChange={handleCategoryChange}
            required
            input={<OutlinedInput label="Category *" />}
            sx={{
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
              },
              '&.Mui-focused': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderWidth: '2px',
                },
              },
            }}
          >
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedCategory && subCategories[selectedCategory.id] && (
          <FormControl fullWidth>
            <InputLabel id="video-subcategory-label">Subcategory</InputLabel>
            <Select
              labelId="video-subcategory-label"
              value={selectedSubCategory?.id?.toString() || ''}
              onChange={handleSubCategoryChange}
              input={<OutlinedInput label="Subcategory" />}
              sx={{
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main',
                  },
                },
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderWidth: '2px',
                  },
                },
              }}
            >
              {subCategories[selectedCategory.id].map((subcategory) => (
                <MenuItem key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {duration && (
          <InfoText>
            Duration: {Math.floor(duration / 60)}:
            {(duration % 60).toString().padStart(2, '0')}
          </InfoText>
        )}

        <ThumbnailSection>
          <Typography variant="subtitle2" fontWeight={600}>
            Select Thumbnail
          </Typography>

          {isExtractingFrames ? (
            <InfoText>Extracting frames...</InfoText>
          ) : (
            <ThumbnailGrid>
              {extractedFrames.map((frame, index) => (
                <ThumbnailOption
                  key={index}
                  selected={selectedThumbnailIndex === index}
                  onClick={() => handleThumbnailSelect(index)}
                >
                  <ThumbnailImage src={frame} alt={`Frame ${index + 1}`} />
                  {selectedThumbnailIndex === index && (
                    <SelectedBadge>✓</SelectedBadge>
                  )}
                </ThumbnailOption>
              ))}

              <CustomThumbnailOption
                selected={selectedThumbnailIndex === -1}
                onClick={() => fileInputRef.current?.click()}
              >
                {customThumbnail ? (
                  <>
                    <ThumbnailImage
                      src={customThumbnail}
                      alt="Custom thumbnail"
                    />
                    {selectedThumbnailIndex === -1 && (
                      <SelectedBadge>✓</SelectedBadge>
                    )}
                  </>
                ) : (
                  <CustomThumbnailContent>
                    <AddPhotoAlternateIcon
                      sx={{ fontSize: 32, opacity: 0.5 }}
                    />
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      Custom
                    </Typography>
                  </CustomThumbnailContent>
                )}
              </CustomThumbnailOption>
            </ThumbnailGrid>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleCustomThumbnailSelect}
          />
        </ThumbnailSection>

        <ButtonContainer>
          <ActionButton variant="secondary" onClick={handleCancel}>
            <CloseIcon fontSize="small" />
            Cancel
          </ActionButton>
          <ActionButton
            variant="primary"
            onClick={handleConfirm}
            disabled={!isFormValid}
            style={{
              opacity: isFormValid ? 1 : 0.5,
              cursor: isFormValid ? 'pointer' : 'not-allowed',
            }}
          >
            <CheckIcon fontSize="small" />
            Add Video
          </ActionButton>
        </ButtonContainer>
      </StyledDialogContent>
    </StyledDialog>
  );
}
