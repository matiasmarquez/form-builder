import type { Field } from '@form-builder/shared';
import {
  AlignLeft,
  CircleCheckBig,
  SquareCheck,
  SquareChevronDown,
  Type
} from 'lucide-vue-next';
import type { Component } from 'vue';

export function fieldTypeLabel(type: Field['type']): string {
  switch (type) {
    case 'text':
      return 'Short answer';
    case 'paragraph':
      return 'Paragraph';
    case 'checkbox':
      return 'Checkboxes';
    case 'radio':
      return 'Multiple choice';
    case 'select':
      return 'Dropdown';
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function fieldTypeIcon(type: Field['type']): Component {
  switch (type) {
    case 'text':
      return Type;
    case 'paragraph':
      return AlignLeft;
    case 'checkbox':
      return SquareCheck;
    case 'radio':
      return CircleCheckBig;
    case 'select':
      return SquareChevronDown;
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export const TEXT_FIELD_TYPES = ['text', 'paragraph'] as const satisfies ReadonlyArray<
  Field['type']
>;
export const MULTI_FIELD_TYPES = [
  'checkbox',
  'radio',
  'select',
] as const satisfies ReadonlyArray<Field['type']>;
