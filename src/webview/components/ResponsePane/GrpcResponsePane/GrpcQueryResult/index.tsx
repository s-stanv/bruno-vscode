import React, { useState, useEffect, useMemo } from 'react';
import CodeEditor from 'components/CodeEditor';
import { get } from 'lodash';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useTheme } from 'providers/Theme/index';
import { decodeGrpcMessage, BinaryField } from 'utils/grpc/decode-message';
import StyledWrapper from './StyledWrapper';
import GrpcError from '../GrpcError';
import { IconChevronDown, IconChevronUp, IconDownload } from '@tabler/icons';

interface GrpcQueryResultProps {
  item: unknown;
  collection?: React.ReactNode;
}

const formatSize = (size: number) => (size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`);

const GrpcQueryResult = ({
  item,
  collection
}: any) => {
  const { displayedTheme } = useTheme();
  const preferences = useSelector((state) => state.app.preferences);
  const [showErrorMessage, setShowErrorMessage] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [showRaw, setShowRaw] = useState(false);

  const response = item.response || {};
  const responsesList = response?.responses || [];
  const reversedResponsesList = [...responsesList].reverse();
  const hasError = response.isError;
  const hasResponses = responsesList.length > 0;
  const errorMessage = response.error;

  useEffect(() => {
    if (hasError) {
      setShowErrorMessage(true);
    }
  }, [response, hasError]);

  const formatJSON = (data: any) => {
    try {
      if (typeof data === 'string') {
        return JSON.stringify(JSON.parse(data), null, 2);
      }
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return typeof data === 'string' ? data : JSON.stringify(data);
    }
  };

  const decodedList = useMemo(() => reversedResponsesList.map((resp) => decodeGrpcMessage(resp)), [responsesList]);

  const renderMessage = (index: number) => {
    const raw = reversedResponsesList[index];
    return showRaw ? formatJSON(raw) : formatJSON(decodedList[index].message);
  };

  const saveBinary = (binary: BinaryField) => {
    window.ipcRenderer
      .invoke<string | null>('renderer:save-base64-to-file', binary.base64, binary.fileName)
      .then((filePath) => {
        if (filePath) {
          toast.success(`Saved to ${filePath}`);
        }
      })
      .catch((err: any) => toast.error(get(err, 'error.message') || 'Could not save the file'));
  };

  const renderBinaries = (binaries: BinaryField[]) => {
    if (showRaw || !binaries.length) {
      return null;
    }
    return (
      <div className="binary-files" data-testid="grpc-binary-files">
        {binaries.map((binary) => (
          <button
            key={binary.path}
            className="binary-file"
            title={`${binary.path}: ${binary.mime}`}
            onClick={() => saveBinary(binary)}
          >
            <IconDownload size={14} strokeWidth={1.5} />
            <span>{binary.fileName}</span>
            <span className="binary-size">{formatSize(binary.size)}</span>
          </button>
        ))}
      </div>
    );
  };

  if (!hasResponses && !hasError) {
    return (
      <StyledWrapper className="w-full h-full relative flex flex-col">
        <div className="empty-state">No messages received</div>
      </StyledWrapper>
    );
  }

  return (
    <StyledWrapper className="w-full h-full relative flex flex-col mt-2" data-testid="grpc-response-content">
      {hasError && showErrorMessage && <GrpcError error={errorMessage} onClose={() => setShowErrorMessage(false)} />}
      {hasResponses && (
        <div className="view-toggle" role="tablist" data-testid="grpc-response-view-toggle">
          <button className={showRaw ? '' : 'active'} role="tab" onClick={() => setShowRaw(false)} title="Bytes decoded: JSON expanded, files can be saved">
            Decoded
          </button>
          <button className={showRaw ? 'active' : ''} role="tab" onClick={() => setShowRaw(true)} title="Response as received, bytes in base64">
            Raw
          </button>
        </div>
      )}
      {hasResponses && (
        <div className={`responses-container ${responsesList.length === 1 ? 'single' : 'multi'}`} data-testid="grpc-responses-container">
          {responsesList.length === 1 ? (
            <div className="single-response" data-testid="grpc-single-response">
              {renderBinaries(decodedList[0].binaries)}
              <div className="editor">
                <CodeEditor
                  collection={collection}
                  font={get(preferences, 'font.codeFont', 'default')}
                  fontSize={get(preferences, 'font.codeFontSize')}
                  theme={displayedTheme}
                  value={renderMessage(0)}
                  mode="application/json"
                  readOnly={true}
                />
              </div>
            </div>
          ) : (
            <div className="messages-list" data-testid="grpc-responses-list">
              {reversedResponsesList.map((resp, index) => {
                const originalIndex = responsesList.length - index - 1;
                const isExpanded = expandedIndex === index;

                return (
                  <div
                    key={originalIndex}
                    className={`message-item ${isExpanded ? 'expanded' : 'collapsed'} ${index === reversedResponsesList.length - 1 ? 'last' : ''}`}
                    data-testid={`grpc-response-item-${originalIndex}`}
                  >
                    <div
                      className="message-header"
                      onClick={() => setExpandedIndex(isExpanded ? -1 : index)}
                    >
                      <span className="message-label">
                        Response {originalIndex + 1}
                        {index === 0 && <span className="latest-badge">Latest</span>}
                      </span>
                      <button className="toggle-btn">
                        {isExpanded ? (
                          <IconChevronUp size={16} strokeWidth={1.5} />
                        ) : (
                          <IconChevronDown size={16} strokeWidth={1.5} />
                        )}
                      </button>
                    </div>
                    {isExpanded && renderBinaries(decodedList[index].binaries)}
                    {isExpanded && (
                      <div className="message-content">
                        <CodeEditor
                          collection={collection}
                          font={get(preferences, 'font.codeFont', 'default')}
                          fontSize={get(preferences, 'font.codeFontSize')}
                          theme={displayedTheme}
                          value={renderMessage(index)}
                          mode="application/json"
                          readOnly={true}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {hasError && !hasResponses && !showErrorMessage && (
        <div className="empty-state">
          No messages received. A server error occurred but has been dismissed.
        </div>
      )}
    </StyledWrapper>
  );
};

export default GrpcQueryResult;
