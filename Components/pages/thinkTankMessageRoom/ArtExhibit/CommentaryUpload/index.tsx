import React, { FC, useState, useRef } from 'react';
import { Button, Modal, Form, Input, Select, Upload, message, Typography, Space, Divider } from 'antd';
import { UploadOutlined, AudioOutlined, VideoCameraOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNotification } from '@/Components/custom/custom-notification';
import { uploadAudioFile, AudioFileMetadata } from '@/utils/supabase-audio-upload';
import { uploadVideoFile, VideoFileMetadata } from '@/utils/supabase-video-upload';
import { useAppSelector } from '@/store';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface CommentaryUploadProps {
  open: boolean;
  onCancel: () => void;
  roomId: string;
  artworkId: string;
  onSuccess: (commentaryUrl: string, type: 'audio' | 'video') => void;
}

interface CommentaryFormData {
  fileType: 'audio' | 'video';
  audioType?: 'commentary' | 'ambient' | 'music';
  videoType?: 'commentary' | 'demo' | 'process';
  description: string;
}

const ACCEPTED_AUDIO_TYPES = '.mp3,.mpeg,.wav,.wave,.aiff,.flac,.ogg,.m4a,.aac';
const ACCEPTED_VIDEO_TYPES = '.mp4,.webm,.ogg,.mov,.avi,.wmv,.flv,.3gp,.3g2';

const CommentaryUpload: FC<CommentaryUploadProps> = ({
  open,
  onCancel,
  roomId,
  artworkId,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { notify } = useNotification();
  const profile = useAppSelector((state) => state.auth);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = form.getFieldsValue();
    const fileType = formData.fileType;

    // Validate file type
    if (fileType === 'audio') {
      const allowedAudioTypes = [
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav',
        'audio/aiff', 'audio/x-aiff', 'audio/flac', 'audio/ogg', 'audio/m4a', 'audio/aac'
      ];
      if (!allowedAudioTypes.includes(file.type)) {
        notify({ type: 'error', message: 'Please select a valid audio file (MP3, WAV, FLAC, etc.)' });
        return;
      }
      if (file.size > 100 * 1024 * 1024) { // 100MB
        notify({ type: 'error', message: 'Audio file must be smaller than 100MB' });
        return;
      }
    } else if (fileType === 'video') {
      const allowedVideoTypes = [
        'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
        'video/x-msvideo', 'video/x-ms-wmv', 'video/x-flv', 'video/3gpp', 'video/3gpp2'
      ];
      if (!allowedVideoTypes.includes(file.type)) {
        notify({ type: 'error', message: 'Please select a valid video file (MP4, WebM, etc.)' });
        return;
      }
      if (file.size > 500 * 1024 * 1024) { // 500MB
        notify({ type: 'error', message: 'Video file must be smaller than 500MB' });
        return;
      }
    }

    setSelectedFile(file);
  };

  const handleFileTypeChange = (value: 'audio' | 'video') => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    form.setFieldsValue({ audioType: undefined, videoType: undefined });
  };

  const handleUpload = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedFile || !profile?.profileId) return;

      setUploading(true);

      let commentaryUrl = '';
      let uploadResult: AudioFileMetadata | VideoFileMetadata | null = null;

      if (values.fileType === 'audio') {
        uploadResult = await uploadAudioFile(
          selectedFile,
          roomId,
          values.audioType || 'commentary',
          profile.profileId,
          values.description
        );
      } else {
        uploadResult = await uploadVideoFile(
          selectedFile,
          roomId,
          values.videoType || 'commentary',
          profile.profileId,
          values.description
        );
      }

      if (uploadResult) {
        commentaryUrl = uploadResult.file_path;
        notify({ type: 'success', message: `${values.fileType === 'audio' ? 'Audio' : 'Video'} commentary uploaded successfully!` });
        onSuccess(commentaryUrl, values.fileType);
        handleCancel();
      } else {
        notify({ type: 'error', message: 'Upload failed. Please try again.' });
      }
    } catch (error: any) {
      notify({ type: 'error', message: error.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    form.resetFields();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onCancel();
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Modal
      title={
        <Title level={3} style={{ margin: 0 }}>
          Upload Commentary
        </Title>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      centered
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ fileType: 'audio' }}
      >
        <Form.Item
          name="fileType"
          label="Commentary Type"
          rules={[{ required: true, message: 'Please select commentary type' }]}
        >
          <Select onChange={handleFileTypeChange}>
            <Option value="audio">
              <Space>
                <AudioOutlined />
                Audio Commentary
              </Space>
            </Option>
            <Option value="video">
              <Space>
                <VideoCameraOutlined />
                Video Commentary
              </Space>
            </Option>
          </Select>
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.fileType !== currentValues.fileType}
        >
          {({ getFieldValue }) => {
            const fileType = getFieldValue('fileType');

            return fileType === 'audio' ? (
              <Form.Item
                name="audioType"
                label="Audio Type"
                rules={[{ required: true, message: 'Please select audio type' }]}
              >
                <Select placeholder="Select audio type">
                  <Option value="commentary">Artist Commentary</Option>
                  <Option value="ambient">Ambient Sound</Option>
                  <Option value="music">Background Music</Option>
                </Select>
              </Form.Item>
            ) : (
              <Form.Item
                name="videoType"
                label="Video Type"
                rules={[{ required: true, message: 'Please select video type' }]}
              >
                <Select placeholder="Select video type">
                  <Option value="commentary">Artist Commentary</Option>
                  <Option value="demo">Creation Demo</Option>
                  <Option value="process">Process Video</Option>
                </Select>
              </Form.Item>
            );
          }}
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please provide a description' }]}
        >
          <TextArea
            rows={3}
            placeholder="Describe your commentary..."
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Divider />

        <div style={{ marginBottom: 16 }}>
          <Text strong>Select File</Text>
          <div style={{ marginTop: 8 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept={form.getFieldValue('fileType') === 'audio' ? ACCEPTED_AUDIO_TYPES : ACCEPTED_VIDEO_TYPES}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <Button
              icon={<UploadOutlined />}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Choose File
            </Button>
          </div>
        </div>

        {selectedFile && (
          <div style={{
            padding: 12,
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            backgroundColor: '#fafafa',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <Text strong>{selectedFile.name}</Text>
              <br />
              <Text type="secondary">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </Text>
            </div>
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={removeFile}
              danger
            />
          </div>
        )}

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Space>
            <Button onClick={handleCancel} disabled={uploading}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleUpload}
              loading={uploading}
              disabled={!selectedFile}
            >
              Upload Commentary
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default CommentaryUpload; 