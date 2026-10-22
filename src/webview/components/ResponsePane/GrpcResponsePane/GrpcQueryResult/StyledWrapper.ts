import styled from 'styled-components';

const StyledWrapper = styled.div`
  height: 100%;
  overflow: hidden;

  .empty-state {
    color: ${(props) => props.theme.colors.text.muted};
  }

  .view-toggle {
    display: flex;
    gap: 4px;
    margin-bottom: 6px;

    button {
      padding: 2px 8px;
      font-size: ${(props) => props.theme.font.size.sm};
      color: ${(props) => props.theme.colors.text.muted};
      border-radius: ${(props) => props.theme.border.radius.sm};

      &.active {
        color: ${(props) => props.theme.text};
        background-color: color-mix(in srgb, ${(props) => props.theme.colors.text.muted} 15%, transparent);
      }
    }
  }

  .binary-files {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 6px;
  }

  .binary-file {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    font-size: ${(props) => props.theme.font.size.sm};
    color: ${(props) => props.theme.text};
    border: 1px solid ${(props) => props.theme.border.border1};
    border-radius: ${(props) => props.theme.border.radius.sm};

    &:hover {
      background-color: color-mix(in srgb, ${(props) => props.theme.colors.text.muted} 15%, transparent);
    }

    .binary-size {
      color: ${(props) => props.theme.colors.text.muted};
    }
  }

  .responses-container {
    flex: 1 1 auto;
    min-height: 0;

    div.CodeMirror {
      height: 100%;
    }

    &.multi {
      overflow-y: auto;
    }
  }

  .single-response {
    display: flex;
    flex-direction: column;
    height: 100%;

    .editor {
      flex: 1 1 auto;
      min-height: 0;
    }
  }

  .messages-list {
    display: flex;
    flex-direction: column;
  }

  .message-item {
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;

    &:not(.last) {
      border-bottom: 1px solid ${(props) => props.theme.border.border1};
    }
  }

  .message-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    cursor: pointer;
    user-select: none;

    &:hover {
      .toggle-btn {
        color: ${(props) => props.theme.text};
      }
    }
  }

  .message-label {
    font-size: ${(props) => props.theme.font.size.sm};
    color: ${(props) => props.theme.colors.text.subtext1};
  }

  .latest-badge {
    margin-left: 8px;
    padding: 2px 6px;
    font-size: ${(props) => props.theme.font.size.xs};
    font-weight: 500;
    color: ${(props) => props.theme.colors.text.green};
    background-color: color-mix(in srgb, ${(props) => props.theme.colors.text.green} 10%, transparent);
    border-radius: ${(props) => props.theme.border.radius.sm};
  }

  .toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${(props) => props.theme.colors.text.muted};
    transition: color 0.15s ease;
  }

  .message-content {
    flex: 0 0 auto;
    height: 240px;
    margin-bottom: 8px;
    overflow: hidden;
  }
`;

export default StyledWrapper;
