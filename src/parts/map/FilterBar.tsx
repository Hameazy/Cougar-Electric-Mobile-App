// Filter chips, the sort switch and the Map / List toggle for the CE-34 map.
// Layout ideas borrowed from Booking.com (simple chips, a clear "Reset" that
// shows how many are on) and Rover (map / list switch).
// The screen owns the filter state, this file only draws it.
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  activeFilterCount,
  DISTANCE_LIMITS,
  hasActiveFilters,
  SORT_OPTIONS,
  type MapFilters,
  type SortMode,
} from '../../technicians/technicianFilters';
import { MAP_COLORS } from './ServiceMapTypes';

export type ResultsView = 'map' | 'list';

export function Chip({
  label,
  active,
  onPress,
  tone = 'gold',
  accessibilityLabel,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  tone?: 'gold' | 'ev';
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[chipStyles.chip, tone === 'ev' && chipStyles.evChip, active && (tone === 'ev' ? chipStyles.evChipActive : chipStyles.chipActive)]}
    >
      <Text style={[chipStyles.chipText, active && (tone === 'ev' ? chipStyles.evChipTextActive : chipStyles.chipTextActive)]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ViewToggle({ view, onChange }: { view: ResultsView; onChange: (view: ResultsView) => void }) {
  return (
    <View accessibilityRole="tablist" style={chipStyles.toggle}>
      {(['map', 'list'] as const).map((option) => {
        const active = view === option;
        return (
          <Pressable
            key={option}
            accessibilityLabel={option === 'map' ? 'Show map' : 'Show list'}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option)}
            style={[chipStyles.toggleOption, active && chipStyles.toggleOptionActive]}
          >
            <Text style={[chipStyles.toggleText, active && chipStyles.toggleTextActive]}>{option === 'map' ? 'Map' : 'List'}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function FilterChips({
  filters,
  onChange,
  specialties,
  issue,
  issueHasMatch,
  showChargers,
  onToggleChargers,
  wrap,
}: {
  filters: MapFilters;
  onChange: (next: MapFilters) => void;
  // specialties somebody in the list really has (never a made-up chip)
  specialties: string[];
  // the electrical issue picked earlier in the request, if any
  issue: string | null;
  issueHasMatch: boolean;
  showChargers: boolean;
  onToggleChargers: () => void;
  // true on wide screens: chips wrap instead of scrolling sideways
  wrap: boolean;
}) {
  const [specialtyOpen, setSpecialtyOpen] = useState(false);

  const mainChips = (
    <>
      <Chip label="Available now" active={filters.availableNow} onPress={() => onChange({ ...filters, availableNow: !filters.availableNow })} />
      {DISTANCE_LIMITS.map((miles) => (
        <Chip
          key={miles}
          label={`${miles} mi`}
          accessibilityLabel={`Within ${miles} miles`}
          active={filters.maxMiles === miles}
          onPress={() => onChange({ ...filters, maxMiles: filters.maxMiles === miles ? null : miles })}
        />
      ))}
      {issue && issueHasMatch && (
        <Chip
          label={`Fits: ${issue}`}
          accessibilityLabel={`Only electricians who fit: ${issue}`}
          active={filters.fitsIssue}
          onPress={() => onChange({ ...filters, fitsIssue: !filters.fitsIssue })}
        />
      )}
      {specialties.length > 0 && (
        <Chip
          label={filters.specialty ? `${filters.specialty} ✕` : `Specialty ${specialtyOpen ? '▴' : '▾'}`}
          accessibilityLabel={filters.specialty ? `Clear specialty ${filters.specialty}` : 'Choose a specialty'}
          active={!!filters.specialty}
          onPress={() => {
            if (filters.specialty) {
              onChange({ ...filters, specialty: null });
              setSpecialtyOpen(false);
            } else {
              setSpecialtyOpen((open) => !open);
            }
          }}
        />
      )}
      <Chip label="EV chargers" tone="ev" active={showChargers} onPress={onToggleChargers} />
    </>
  );

  const specialtyChips = specialtyOpen && !filters.specialty ? (
    <>
      {specialties.map((specialty) => (
        <Chip
          key={specialty}
          label={specialty}
          active={false}
          onPress={() => {
            onChange({ ...filters, specialty });
            setSpecialtyOpen(false);
          }}
        />
      ))}
    </>
  ) : null;

  if (wrap) {
    return (
      <View style={{ gap: 8 }}>
        <View style={[chipStyles.row, chipStyles.rowWrap]}>{mainChips}</View>
        {specialtyChips && <View style={[chipStyles.row, chipStyles.rowWrap]}>{specialtyChips}</View>}
      </View>
    );
  }
  return (
    <View style={{ gap: 8 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={chipStyles.row}>{mainChips}</ScrollView>
      {specialtyChips && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={chipStyles.row}>{specialtyChips}</ScrollView>
      )}
    </View>
  );
}

export function SortBar({
  sort,
  onSortChange,
  filters,
  onReset,
}: {
  sort: SortMode;
  onSortChange: (sort: SortMode) => void;
  filters: MapFilters;
  onReset: () => void;
}) {
  const count = activeFilterCount(filters);
  return (
    <View style={chipStyles.sortRow}>
      <Text style={chipStyles.sortLabel}>Sort by</Text>
      {SORT_OPTIONS.map((option) => (
        <Pressable
          key={option.id}
          accessibilityRole="button"
          accessibilityState={{ selected: sort === option.id }}
          onPress={() => onSortChange(option.id)}
          style={[chipStyles.sortOption, sort === option.id && chipStyles.sortOptionActive]}
        >
          <Text style={[chipStyles.sortText, sort === option.id && chipStyles.sortTextActive]}>{option.label}</Text>
        </Pressable>
      ))}
      {hasActiveFilters(filters) && (
        <Pressable accessibilityLabel={`Reset ${count} ${count === 1 ? 'filter' : 'filters'}`} accessibilityRole="button" hitSlop={8} onPress={onReset} style={chipStyles.reset}>
          <Text style={chipStyles.resetText}>Reset ({count})</Text>
        </Pressable>
      )}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  row: { gap: 8, paddingRight: 8 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', paddingRight: 0 },
  chip: { borderColor: MAP_COLORS.line, borderRadius: 20, borderWidth: 1, justifyContent: 'center', maxWidth: 240, minHeight: 40, paddingHorizontal: 16 },
  chipActive: { backgroundColor: MAP_COLORS.volt, borderColor: MAP_COLORS.volt },
  chipText: { color: '#D7DFEC', fontSize: 14, fontWeight: '700' },
  chipTextActive: { color: MAP_COLORS.night },
  evChip: { borderStyle: 'dashed' },
  evChipActive: { backgroundColor: '#241B4A', borderColor: MAP_COLORS.charger, borderStyle: 'solid' },
  evChipTextActive: { color: '#D6CBFF' },

  toggle: { backgroundColor: MAP_COLORS.night, borderColor: MAP_COLORS.line, borderRadius: 20, borderWidth: 1, flexDirection: 'row', padding: 3 },
  toggleOption: { alignItems: 'center', borderRadius: 17, justifyContent: 'center', minHeight: 36, minWidth: 58, paddingHorizontal: 14 },
  toggleOptionActive: { backgroundColor: MAP_COLORS.volt },
  toggleText: { color: '#D7DFEC', fontSize: 14, fontWeight: '800' },
  toggleTextActive: { color: MAP_COLORS.night },

  sortRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sortLabel: { color: MAP_COLORS.muted, fontSize: 13, fontWeight: '700' },
  sortOption: { borderColor: '#2A3240', borderRadius: 14, borderWidth: 1, justifyContent: 'center', minHeight: 34, paddingHorizontal: 12 },
  sortOptionActive: { backgroundColor: '#1B2638', borderColor: MAP_COLORS.volt },
  sortText: { color: '#AAB5C7', fontSize: 13, fontWeight: '700' },
  sortTextActive: { color: MAP_COLORS.text },
  reset: { justifyContent: 'center', marginLeft: 'auto', minHeight: 34, paddingHorizontal: 6 },
  resetText: { color: MAP_COLORS.volt, fontSize: 13, fontWeight: '800' },
});
