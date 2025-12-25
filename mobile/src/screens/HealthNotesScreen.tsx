import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/ApiService';

interface HealthNote {
  id?: number;
  note_date: string;
  blood_sugar?: number;
  blood_sugar_status?: 'low' | 'normal' | 'high';
  cholesterol?: number;
  cholesterol_status?: 'low' | 'normal' | 'high';
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  blood_pressure_status?: 'low' | 'normal' | 'high';
  notes?: string;
}

interface HealthNotesScreenProps {
  navigation: any;
}

const getLocalISODate = (date = new Date()) => {
  // Normalize to local date without timezone shift
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

const PLACEHOLDER_COLOR = '#7A7A7A';

const HealthNotesScreen: React.FC<HealthNotesScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [selectedDate, setSelectedDate] = useState<string>(getLocalISODate());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [bloodSugar, setBloodSugar] = useState('');
  const [cholesterol, setCholesterol] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [notes, setNotes] = useState('');
  
  // Status states
  const [bloodSugarStatus, setBloodSugarStatus] = useState<'low' | 'normal' | 'high' | null>(null);
  const [cholesterolStatus, setCholesterolStatus] = useState<'low' | 'normal' | 'high' | null>(null);
  const [bloodPressureStatus, setBloodPressureStatus] = useState<'low' | 'normal' | 'high' | null>(null);
  
  // Calendar states
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [healthNotes, setHealthNotes] = useState<HealthNote[]>([]);
  const [existingNote, setExistingNote] = useState<HealthNote | null>(null);

  useEffect(() => {
    loadHealthNotes();
  }, []);

  useEffect(() => {
    loadNoteForDate(selectedDate);
  }, [selectedDate]);

  // Calculate status based on values
  useEffect(() => {
    if (bloodSugar) {
      const value = parseFloat(bloodSugar);
      if (value < 140) setBloodSugarStatus('low');
      else if (value >= 140 && value <= 199) setBloodSugarStatus('normal');
      else setBloodSugarStatus('high');
    }
  }, [bloodSugar]);

  useEffect(() => {
    if (cholesterol) {
      const value = parseFloat(cholesterol);
      if (value < 200) setCholesterolStatus('low');
      else if (value >= 200 && value <= 239) setCholesterolStatus('normal');
      else setCholesterolStatus('high');
    }
  }, [cholesterol]);

  useEffect(() => {
    if (systolic && diastolic) {
      const sys = parseInt(systolic);
      const dia = parseInt(diastolic);
      if (sys < 120 && dia < 80) setBloodPressureStatus('low');
      else if ((sys >= 120 && sys <= 139) || (dia >= 80 && dia <= 89)) setBloodPressureStatus('normal');
      else setBloodPressureStatus('high');
    }
  }, [systolic, diastolic]);

  const loadHealthNotes = async () => {
    try {
      const response = await ApiService.getHealthNotes();
      setHealthNotes(response);
    } catch (error) {
      console.error('Failed to load health notes:', error);
    }
  };

  const loadNoteForDate = async (date: string) => {
    setLoading(true);
    try {
      const response = await ApiService.getHealthNoteByDate(date);
      if (response) {
        setExistingNote(response);
        setBloodSugar(response.blood_sugar?.toString() || '');
        setCholesterol(response.cholesterol?.toString() || '');
        setSystolic(response.blood_pressure_systolic?.toString() || '');
        setDiastolic(response.blood_pressure_diastolic?.toString() || '');
        setNotes(response.notes || '');
      } else {
        setExistingNote(null);
      }
    } catch (error) {
      // No note for this date, don't clear form
      setExistingNote(null);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setBloodSugar('');
    setCholesterol('');
    setSystolic('');
    setDiastolic('');
    setNotes('');
    setBloodSugarStatus(null);
    setCholesterolStatus(null);
    setBloodPressureStatus(null);
  };

  const handleSave = async () => {
    if (!bloodSugar && !cholesterol && !systolic && !diastolic) {
      Alert.alert('Error', 'Mohon isi setidaknya satu data kesehatan');
      return;
    }

    setSaving(true);
    try {
      await ApiService.saveHealthNote({
        note_date: selectedDate,
        blood_sugar: bloodSugar ? parseFloat(bloodSugar) : undefined,
        blood_sugar_status: bloodSugarStatus || undefined,
        cholesterol: cholesterol ? parseFloat(cholesterol) : undefined,
        cholesterol_status: cholesterolStatus || undefined,
        blood_pressure_systolic: systolic ? parseInt(systolic) : undefined,
        blood_pressure_diastolic: diastolic ? parseInt(diastolic) : undefined,
        blood_pressure_status: bloodPressureStatus || undefined,
        notes: notes || undefined,
      });

      Alert.alert('Sukses', 'Catatan kesehatan berhasil disimpan');
      await loadHealthNotes();
      await loadNoteForDate(selectedDate); // Reload the current date to update existingNote
    } catch (error) {
      console.error('Failed to save health note:', error);
      Alert.alert('Error', 'Gagal menyimpan catatan kesehatan');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: 'low' | 'normal' | 'high' | null) => {
    if (!status) return '#E0E0E0';
    switch (status) {
      case 'low': return '#FFF176'; // Yellow
      case 'normal': return '#81C784'; // Green
      case 'high': return '#E57373'; // Red
    }
  };

  const getStatusText = (status: 'low' | 'normal' | 'high' | null) => {
    if (!status) return '-';
    switch (status) {
      case 'low': return 'Rendah';
      case 'normal': return 'Normal';
      case 'high': return 'Tinggi';
    }
  };

  const formatDate = (dateString: string) => {
    const date = parseLocalDate(dateString);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const hasNoteForDate = (day: number) => {
    const checkDate = getLocalISODate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    return healthNotes.some(note => note.note_date === checkDate);
  };

  const renderResultsTable = () => {
    if (!existingNote) return null;

    const hasBloodPressure = existingNote.blood_pressure_systolic && existingNote.blood_pressure_diastolic;
    const hasBloodSugar = existingNote.blood_sugar;
    const hasCholesterol = existingNote.cholesterol;

    if (!hasBloodPressure && !hasBloodSugar && !hasCholesterol) return null;

    return (
      <View style={styles.resultsTableContainer}>
        <Text style={styles.tableDate}>{formatDate(selectedDate)}</Text>
        
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableHeader, { flex: 1.5 }]}>
              <Text style={styles.tableHeaderText}>TEST</Text>
            </View>
            <View style={[styles.tableCell, styles.tableHeader, { flex: 1.5 }]}>
              <Text style={styles.tableHeaderText}>NILAI</Text>
            </View>
            <View style={[styles.tableCell, styles.tableHeader, { flex: 1 }]}>
              <Text style={styles.tableHeaderText}>HASIL</Text>
            </View>
          </View>

          {/* Blood Pressure Row */}
          {hasBloodPressure && (
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableCellBordered, { flex: 1.5 }]}>
                <Text style={styles.tableCellText}>Tekanan Darah</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellBordered, { flex: 1.5 }]}>
                <Text style={styles.tableCellText}>
                  {existingNote.blood_pressure_systolic}/{existingNote.blood_pressure_diastolic} mmHg
                </Text>
              </View>
              <View style={[
                styles.tableCell, 
                styles.tableCellBordered, 
                { flex: 1, backgroundColor: getStatusColor(existingNote.blood_pressure_status || null) }
              ]}>
                <Text style={styles.tableCellTextBold}>
                  {getStatusText(existingNote.blood_pressure_status || null)}
                </Text>
              </View>
            </View>
          )}

          {/* Blood Sugar Row */}
          {hasBloodSugar && (
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableCellBordered, { flex: 1.5 }]}>
                <Text style={styles.tableCellText}>Gula Darah Sewaktu</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellBordered, { flex: 1.5 }]}>
                <Text style={styles.tableCellText}>{existingNote.blood_sugar} mg/dL</Text>
              </View>
              <View style={[
                styles.tableCell, 
                styles.tableCellBordered, 
                { flex: 1, backgroundColor: getStatusColor(existingNote.blood_sugar_status || null) }
              ]}>
                <Text style={styles.tableCellTextBold}>
                  {getStatusText(existingNote.blood_sugar_status || null)}
                </Text>
              </View>
            </View>
          )}

          {/* Cholesterol Row */}
          {hasCholesterol && (
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableCellBordered, { flex: 1.5 }]}>
                <Text style={styles.tableCellText}>Kolesterol</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellBordered, { flex: 1.5 }]}>
                <Text style={styles.tableCellText}>{existingNote.cholesterol} mg/dL</Text>
              </View>
              <View style={[
                styles.tableCell, 
                styles.tableCellBordered, 
                { flex: 1, backgroundColor: getStatusColor(existingNote.cholesterol_status || null) }
              ]}>
                <Text style={styles.tableCellTextBold}>
                  {getStatusText(existingNote.cholesterol_status || null)}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.tableFooter}>
          <Text style={styles.tableFooterText}>
            Jangan khawatir jika hasil tesmu berwarna merah atau kuning.{' '}
            <Text 
              style={styles.tableFooterLink}
              onPress={() => navigation.navigate('Materials', { initialFilter: 'poster' })}
            >
              Klik disini
            </Text> untuk mengatasinya!
          </Text>
        </View>
      </View>
    );
  };

  const renderCalendar = () => {
    const days = getDaysInMonth(currentMonth);
    const weekDays = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];
    
    const monthNames = [
      'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
      'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
    ];

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            onPress={() => {
              const newDate = new Date(currentMonth);
              newDate.setMonth(newDate.getMonth() - 1);
              setCurrentMonth(newDate);
            }}
          >
            <Icon name="chevron-left" size={32} color="#000" />
          </TouchableOpacity>
          
          <Text style={styles.calendarTitle}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          
          <TouchableOpacity
            onPress={() => {
              const newDate = new Date(currentMonth);
              newDate.setMonth(newDate.getMonth() + 1);
              setCurrentMonth(newDate);
            }}
          >
            <Icon name="chevron-right" size={32} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.weekDaysContainer}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.weekDayCell}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>

        <View style={styles.daysContainer}>
          {days.map((day, index) => {
            if (day === null) {
              return <View key={index} style={styles.dayCell} />;
            }

            const dateString = getLocalISODate(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
            );
            
            const isSelected = dateString === selectedDate;
            const hasNote = hasNoteForDate(day);
            const isToday = dateString === getLocalISODate();

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  isSelected && styles.selectedDayCell,
                  isToday && !isSelected && styles.todayCell,
                ]}
                onPress={() => setSelectedDate(dateString)}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.selectedDayText,
                    isToday && !isSelected && styles.todayText,
                  ]}
                >
                  {day}
                </Text>
                {hasNote && (
                  <View style={styles.noteDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.appName}>CATATAN KESEHATAN</Text>
          <Text style={styles.greeting}>HELLO, {user?.name || 'User'}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Calendar */}
        {renderCalendar()}

        {/* Selected Date Display */}
        <View style={styles.selectedDateContainer}>
          <Text style={styles.selectedDateText}>{formatDate(selectedDate)}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#8BCDF0" style={styles.loader} />
        ) : (
          <>
            {/* Results Table - Only show if there's existing data */}
            {renderResultsTable()}

            {/* Health Input Form */}
            <View style={styles.formContainer}>
              {/* Blood Sugar */}
              <View style={styles.inputSection}>
                <View style={styles.labelContainer}>
                  <Text style={styles.label}>1. Gula Darah Sewaktu (GDS)</Text>
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="Masukkan nilai"
                    keyboardType="decimal-pad"
                    value={bloodSugar}
                    onChangeText={setBloodSugar}
                    placeholderTextColor={PLACEHOLDER_COLOR}
                  />
                  <Text style={styles.unit}>mg/dL</Text>
                </View>
                {bloodSugarStatus && (
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(bloodSugarStatus) }]}>
                    <Text style={styles.statusText}>{getStatusText(bloodSugarStatus)}</Text>
                  </View>
                )}
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>🟡 Rendah: {'<'} 140 mg/dL</Text>
                  <Text style={styles.infoText}>🟢 Normal: 140 – 199 mg/dL</Text>
                  <Text style={styles.infoText}>🔴 Tinggi: {'>'} 200 mg/dL</Text>
                </View>
              </View>

              {/* Cholesterol */}
              <View style={styles.inputSection}>
                <View style={styles.labelContainer}>
                  <Text style={styles.label}>2. Kolesterol Total</Text>
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="Masukkan nilai"
                    keyboardType="decimal-pad"
                    value={cholesterol}
                    onChangeText={setCholesterol}
                    placeholderTextColor={PLACEHOLDER_COLOR}
                  />
                  <Text style={styles.unit}>mg/dL</Text>
                </View>
                {cholesterolStatus && (
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(cholesterolStatus) }]}>
                    <Text style={styles.statusText}>{getStatusText(cholesterolStatus)}</Text>
                  </View>
                )}
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>🟡 Rendah / Baik: {'<'} 200 mg/dL</Text>
                  <Text style={styles.infoText}>🟢 Normal / Batas Atas: 200 – 239 mg/dL</Text>
                  <Text style={styles.infoText}>🔴 Tinggi: {'>'} 240 mg/dL</Text>
                </View>
              </View>

              {/* Blood Pressure */}
              <View style={styles.inputSection}>
                <View style={styles.labelContainer}>
                  <Text style={styles.label}>3. Tekanan Darah (Tensi)</Text>
                </View>
                <View style={styles.bloodPressureRow}>
                  <View style={styles.bpInputContainer}>
                    <TextInput
                      style={styles.bpInput}
                      placeholder="120"
                      keyboardType="number-pad"
                      value={systolic}
                      onChangeText={setSystolic}
                      placeholderTextColor={PLACEHOLDER_COLOR}
                    />
                    <Text style={styles.bpLabel}>Sistolik</Text>
                  </View>
                  <Text style={styles.bpSlash}>/</Text>
                  <View style={styles.bpInputContainer}>
                    <TextInput
                      style={styles.bpInput}
                      placeholder="80"
                      keyboardType="number-pad"
                      value={diastolic}
                      onChangeText={setDiastolic}
                      placeholderTextColor={PLACEHOLDER_COLOR}
                    />
                    <Text style={styles.bpLabel}>Diastolik</Text>
                  </View>
                  <Text style={styles.unit}>mmHg</Text>
                </View>
                {bloodPressureStatus && (
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(bloodPressureStatus) }]}>
                    <Text style={styles.statusText}>{getStatusText(bloodPressureStatus)}</Text>
                  </View>
                )}
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>🟡 Rendah: {'<'} 120/80 mmHg</Text>
                  <Text style={styles.infoText}>🟢 Normal / Pra-hipertensi: 120–139 / 80–89 mmHg</Text>
                  <Text style={styles.infoText}>🔴 Tinggi: {'>'} 140/90 mmHg (hipertensi)</Text>
                </View>
              </View>

              {/* Additional Notes */}
              <View style={styles.inputSection}>
                <View style={styles.labelContainer}>
                  <Text style={styles.label}>Catatan Tambahan (Opsional)</Text>
                </View>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Masukkan catatan atau gejala yang dirasakan..."
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={setNotes}
                  textAlignVertical="top"
                  placeholderTextColor={PLACEHOLDER_COLOR}
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Icon name="save" size={24} color="#fff" />
                    <Text style={styles.saveButtonText}>SIMPAN CATATAN</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Warning Text */}
              {/* <View style={styles.warningBox}>
                <Icon name="info-outline" size={20} color="#FF6B6B" />
                <Text style={styles.warningText}>
                  Jangan khawatir jika hasil tesmu berwarna merah atau kuning. Klik disini untuk mengatasinya
                </Text>
              </View> */}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#8BCDF0',
    paddingVertical: 24,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#000',
    padding: 16,
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  selectedDayCell: {
    backgroundColor: '#8BCDF0',
    borderRadius: 8,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: '#8BCDF0',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 14,
    color: '#000',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  todayText: {
    fontWeight: 'bold',
    color: '#8BCDF0',
  },
  noteDot: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  selectedDateContainer: {
    backgroundColor: '#8BCDF0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    padding: 12,
    marginBottom: 16,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  loader: {
    marginVertical: 32,
  },
  formContainer: {
    gap: 20,
  },
  inputSection: {
    marginBottom: 8,
  },
  labelContainer: {
    backgroundColor: '#8BCDF0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    padding: 12,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
    color: '#000',
  },
  unit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    minWidth: 50,
  },
  bloodPressureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bpInputContainer: {
    flex: 1,
  },
  bpInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    color: '#000',
  },
  bpLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  bpSlash: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginHorizontal: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  infoBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  infoText: {
    fontSize: 13,
    color: '#000',
    marginBottom: 4,
  },
  notesInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    color: '#000',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFB74D',
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#000',
    lineHeight: 18,
  },
  resultsTableContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000',
    overflow: 'hidden',
  },
  tableDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    padding: 16,
    backgroundColor: '#f5f5f5',
    textAlign: 'center',
  },
  table: {
    borderWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#8BCDF0',
    borderBottomWidth: 2,
    borderColor: '#000',
  },
  tableHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  tableCellBordered: {
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#000',
  },
  tableCellText: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
  },
  tableCellTextBold: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  tableFooter: {
    padding: 12,
    backgroundColor: '#fff',
  },
  tableFooterText: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
    lineHeight: 18,
  },
  tableFooterLink: {
    color: '#2196F3',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default HealthNotesScreen;




