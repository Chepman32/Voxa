import React from 'react';
import { Modal, Text, TextInput } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

const mockWithSpring = jest.fn(
  (value: number, _config?: object, callback?: (finished: boolean) => void) => {
    callback?.(true);
    return value;
  },
);

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: require('react-native').View },
  ReduceMotion: { System: 'system' },
  cancelAnimation: jest.fn(),
  interpolate: jest.fn(
    (_value: number, _input: number[], output: number[]) => output.at(-1),
  ),
  runOnJS: (callback: (...args: unknown[]) => unknown) => callback,
  useAnimatedStyle: (callback: () => object) => callback(),
  useSharedValue: (value: number) =>
    require('react').useRef({ value }).current,
  withSpring: (
    value: number,
    config?: object,
    callback?: (finished: boolean) => void,
  ) => mockWithSpring(value, config, callback),
  withTiming: (value: number) => value,
}));

jest.mock('react-native-vector-icons/Feather', () => () => null);

jest.mock('../src/components/common/GlassPanel', () => ({
  GlassPanel: ({ children, ...props }: { children: React.ReactNode }) =>
    require('react').createElement(
      require('react-native').View,
      props,
      children,
    ),
}));

jest.mock('../src/services/haptics', () => ({
  haptics: { light: jest.fn(), medium: jest.fn() },
}));

import {
  TEXT_PROMPT_CANCEL_TEST_ID,
  TEXT_PROMPT_CONFIRM_TEST_ID,
  TEXT_PROMPT_INPUT_TEST_ID,
  TextPromptModal,
} from '../src/components/common/TextPromptModal';

function renderModal(
  onClose = jest.fn(),
  onSubmit = jest.fn(),
  options: { defaultValue?: string; visible?: boolean } = {},
) {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <TextPromptModal
        cancelLabel="Cancel"
        confirmLabel="Create Folder"
        defaultValue={options.defaultValue}
        message="Give your projects a home."
        onClose={onClose}
        onSubmit={onSubmit}
        placeholder="e.g. Social clips"
        title="Create New Folder"
        visible={options.visible ?? true}
      />,
    );
  });

  return renderer!;
}

describe('TextPromptModal', () => {
  beforeEach(() => {
    mockWithSpring.mockClear();
  });

  it('presents friendly copy and a focused text field', () => {
    const renderer = renderModal();
    const copy = renderer.root.findAllByType(Text).map(node => node.props.children);
    const input = renderer.root.findByType(TextInput);

    expect(copy).toEqual(
      expect.arrayContaining(['Create New Folder', 'Give your projects a home.']),
    );
    expect(input.props).toMatchObject({
      autoFocus: true,
      placeholder: 'e.g. Social clips',
    });
  });

  it('trims the folder name and submits it after the spring dismissal', () => {
    const onClose = jest.fn();
    const onSubmit = jest.fn();
    const renderer = renderModal(onClose, onSubmit);
    const input = renderer.root.findByProps({ testID: TEXT_PROMPT_INPUT_TEST_ID });

    ReactTestRenderer.act(() => {
      input.props.onChangeText('  Social clips  ');
    });

    const confirm = renderer.root.findByProps({
      testID: TEXT_PROMPT_CONFIRM_TEST_ID,
    });
    expect(confirm.props.disabled).toBe(false);

    ReactTestRenderer.act(() => {
      confirm.props.onPress();
    });

    expect(onSubmit).toHaveBeenCalledWith('Social clips');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps Create disabled for a blank name', () => {
    const onSubmit = jest.fn();
    const renderer = renderModal(jest.fn(), onSubmit);
    const input = renderer.root.findByProps({ testID: TEXT_PROMPT_INPUT_TEST_ID });

    ReactTestRenderer.act(() => {
      input.props.onChangeText('   ');
    });

    expect(
      renderer.root.findByProps({ testID: TEXT_PROMPT_CONFIRM_TEST_ID }).props
        .disabled,
    ).toBe(true);

    ReactTestRenderer.act(() => {
      input.props.onSubmitEditing();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('prefills and selects an existing value for rename flows', () => {
    const renderer = renderModal(jest.fn(), jest.fn(), {
      defaultValue: 'Existing name',
    });

    expect(
      renderer.root.findByProps({ testID: TEXT_PROMPT_INPUT_TEST_ID }).props,
    ).toMatchObject({
      selectTextOnFocus: true,
      value: 'Existing name',
    });
  });

  it('stays unmounted from interaction when it is not visible', () => {
    const renderer = renderModal(jest.fn(), jest.fn(), { visible: false });

    expect(renderer.root.findByType(Modal).props.visible).toBe(false);
  });

  it('dismisses from Cancel and honors the system reduced-motion setting', () => {
    const onClose = jest.fn();
    const renderer = renderModal(onClose);

    expect(mockWithSpring).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        damping: expect.any(Number),
        reduceMotion: 'system',
        stiffness: expect.any(Number),
        velocity: expect.any(Number),
      }),
      undefined,
    );

    ReactTestRenderer.act(() => {
      renderer.root
        .findByProps({ testID: TEXT_PROMPT_CANCEL_TEST_ID })
        .props.onPress();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(renderer.root.findByType(Modal).props.visible).toBe(true);
  });

  it('ignores repeated dismissal gestures while the exit spring is running', () => {
    const onClose = jest.fn();
    const renderer = renderModal(onClose);
    mockWithSpring.mockImplementationOnce(value => value);
    const cancel = renderer.root.findByProps({
      testID: TEXT_PROMPT_CANCEL_TEST_ID,
    });

    ReactTestRenderer.act(() => {
      cancel.props.onPress();
      cancel.props.onPress();
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not close when the exit spring is interrupted', () => {
    const onClose = jest.fn();
    const renderer = renderModal(onClose);
    mockWithSpring.mockImplementationOnce((value, _config, callback) => {
      callback?.(false);
      return value;
    });

    ReactTestRenderer.act(() => {
      renderer.root
        .findByProps({ testID: TEXT_PROMPT_CANCEL_TEST_ID })
        .props.onPress();
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});
