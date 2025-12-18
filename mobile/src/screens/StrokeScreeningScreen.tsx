import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import ApiService from '../services/ApiService';

type NavigationProp = StackNavigationProp<RootStackParamList, 'StrokeScreening'>;

interface ScreeningQuestion {
  id: number;
  question: string;
  options: {
    label: string;
    value: 'A' | 'B' | 'C';
    text: string;
  }[];
}

const StrokeScreeningScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [screeningAnswers, setScreeningAnswers] = useState<{ [key: number]: 'A' | 'B' | 'C' }>({});
  const [screeningResult, setScreeningResult] = useState<{ score: number; category: string; color: string; riskLevel: string } | null>(null);
  const [isSubmittingScreening, setIsSubmittingScreening] = useState(false);
  const [showScreeningResult, setShowScreeningResult] = useState(false);

  const screeningQuestions: ScreeningQuestion[] = [
    {
      id: 1,
      question: 'Tekanan Darah\nApakah anda memiliki riwayat tekanan darah yang tinggi, sedang, atau normal?',
      options: [
        { label: 'A', value: 'A', text: 'Tinggi (>140/90 mmHg atau Hipertensi)' },
        { label: 'B', value: 'B', text: 'Sedang (120–139/80–89 mmHg)' },
        { label: 'C', value: 'C', text: 'Normal (<120/80 mmHg)' },
      ],
    },
    {
      id: 2,
      question: 'Irama Jantung / Detak Jantung (Atrial Fibrilasi)\nApakah anda memiliki riwayat jantung? jantung berdetak tidak teratur? Atau belum pernah periksa?',
      options: [
        { label: 'A', value: 'A', text: 'Ya, saya memiliki riwayat jantung (aritmia)' },
        { label: 'B', value: 'B', text: 'Tidak yakin' },
        { label: 'C', value: 'C', text: 'Tidak, saya tidak memiliki riwayat jantung (normal)' },
      ],
    },
    {
      id: 3,
      question: 'Kebiasaan Merokok\nApakah anda masih merokok sekarang?',
      options: [
        { label: 'A', value: 'A', text: 'Ya, saya masih merokok' },
        { label: 'B', value: 'B', text: 'Jarang, saya sedang mencoba berhenti' },
        { label: 'C', value: 'C', text: 'Tidak, saya tidak pernah merokok' },
      ],
    },
    {
      id: 4,
      question: 'Kolesterol\nApakah anda memiliki riwayat kolesterol yang tinggi, sedang, atau normal?',
      options: [
        { label: 'A', value: 'A', text: 'Tinggi (>240 mg/dL atau tidak yakin)' },
        { label: 'B', value: 'B', text: 'Sedang (200–239 mg/dL)' },
        { label: 'C', value: 'C', text: 'Normal (<200 mg/dL)' },
      ],
    },
    {
      id: 5,
      question: 'Diabetes\nApakah anda memiliki riwayat diabetes melitus?',
      options: [
        { label: 'A', value: 'A', text: 'Ya, saya memiliki riwayat diabetes melitus' },
        { label: 'B', value: 'B', text: 'Batas atas (pernah dibilang "hampir diabetes")' },
        { label: 'C', value: 'C', text: 'Tidak, saya tidak memiliki riwayat diabetes melitus' },
      ],
    },
    {
      id: 6,
      question: 'Aktivitas Fisik\nSeberapa sering anda berolahraga atau bergerak aktif dalam seminggu?',
      options: [
        { label: 'A', value: 'A', text: 'Jarang bergerak (lebih banyak duduk, tidak olahraga)' },
        { label: 'B', value: 'B', text: 'Kadang olahraga (sesekali)' },
        { label: 'C', value: 'C', text: 'Rutin olahraga (teratur setiap minggu)' },
      ],
    },
    {
      id: 7,
      question: 'Berat Badan\nBagaimana hasil cek perhitungan berat badan anda?\n*jika belum mengetahui silahkan cek di website halodoc (bmi calculator)',
      options: [
        { label: 'A', value: 'A', text: 'Kelebihan berat badan (Obesitas)' },
        { label: 'B', value: 'B', text: 'Berat badan berlebih' },
        { label: 'C', value: 'C', text: 'Berat badan ideal' },
      ],
    },
    {
      id: 8,
      question: 'Riwayat stroke dalam Keluarga\nApakah ada anggota keluarga dekat (kakek/nenek, orang tua, kakak, adik) anda yang pernah mengalami/ riwayat stroke?',
      options: [
        { label: 'A', value: 'A', text: 'Ya, salah satu keluarga saya memiliki stroke' },
        { label: 'B', value: 'B', text: 'Saya, tidak yakin' },
        { label: 'C', value: 'C', text: 'Tidak, keluarga saya tidak memiliki riwayat stroke' },
      ],
    },
  ];

  const calculateScore = (): number => {
    let totalScore = 0;
    Object.values(screeningAnswers).forEach((answer) => {
      if (answer === 'A') totalScore += 3;
      else if (answer === 'B') totalScore += 1;
      // C = 0, no need to add
    });
    return totalScore;
  };

  const getRiskCategory = (score: number): { category: string; color: string; riskLevel: string; recommendation: string } => {
    if (score >= 0 && score <= 4) {
      return { 
        category: 'BERISIKO RENDAH', 
        color: '#4CAF50',
        riskLevel: 'RENDAH',
        recommendation: 'Anda berada pada kategori risiko rendah. Tetap jaga pola hidup sehat untuk mencegah peningkatan risiko di masa depan.'
      };
    } else if (score >= 5 && score <= 8) {
      return { 
        category: 'BERISIKO SEDANG', 
        color: '#FFC107',
        riskLevel: 'SEDANG',
        recommendation: 'Anda berada pada kategori risiko sedang. Disarankan mulai memperbaiki gaya hidup dan memeriksakan diri bila muncul gejala.'
      };
    } else {
      // score >= 9 && score <= 24
      return { 
        category: 'BERISIKO TINGGI', 
        color: '#F44336',
        riskLevel: 'TINGGI',
        recommendation: 'Anda berada pada kategori risiko tinggi. Disarankan segera melakukan pemeriksaan lebih lanjut ke fasilitas kesehatan.'
      };
    }
  };

  const handleAnswerChange = (questionId: number, answer: 'A' | 'B' | 'C') => {
    setScreeningAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitScreening = async () => {
    // Check if all questions are answered
    if (Object.keys(screeningAnswers).length !== screeningQuestions.length) {
      Alert.alert('Perhatian', 'Mohon jawab semua pertanyaan sebelum melanjutkan.');
      return;
    }

    const score = calculateScore();
    const riskCategory = getRiskCategory(score);
    
    setScreeningResult({ 
      score, 
      category: riskCategory.category, 
      color: riskCategory.color,
      riskLevel: riskCategory.riskLevel
    });

    // Submit to API
    setIsSubmittingScreening(true);
    try {
      await ApiService.submitScreening({
        answers: screeningAnswers,
        score,
        category: riskCategory.category,
        riskLevel: score <= 4 ? 'low' : score <= 8 ? 'medium' : 'high', // 0-4: low, 5-8: medium, 9-24: high
      });
    } catch (error: any) {
      console.error('Error submitting screening:', error);
      // Still show result even if API fails
    } finally {
      setIsSubmittingScreening(false);
      setShowScreeningResult(true);
    }
  };

  const handleLearnAboutStroke = () => {
    navigation.navigate('Materials');
    setShowScreeningResult(false);
  };

  const handleBackFromResult = () => {
    setShowScreeningResult(false);
    setScreeningResult(null);
    setScreeningAnswers({});
  };

  const handleBack = () => {
    if (showScreeningResult) {
      handleBackFromResult();
    } else {
      navigation.goBack();
    }
  };

  const handleResetScreening = () => {
    setShowScreeningResult(false);
    setScreeningResult(null);
    setScreeningAnswers({});
  };

  // Screening Result Screen
  if (showScreeningResult && screeningResult) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header with back button */}
        <View style={styles.resultHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.resultHeaderTitle}>SKRINING RISIKO STROKE</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.resultScrollContent}
          showsVerticalScrollIndicator={true}
        >
          <Text style={styles.resultHeaderText}>HASIL SKRINING RISIKO STROKE ANDA</Text>

          {/* Red/Green/Yellow Risk Box */}
          <View style={[styles.riskResultBox, { backgroundColor: screeningResult.color }]}>
            <Text style={styles.riskScoreText}>Skor Total : {screeningResult.score}</Text>
            <Text style={styles.riskCategoryText}>Kategori : {screeningResult.category}</Text>
          </View>

          {/* Recommendation Box */}
          <View style={styles.recommendationBox}>
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationText}>
                {getRiskCategory(screeningResult.score).recommendation}
              </Text>
              <Icon name="warning" size={24} color="#000" style={styles.warningIcon} />
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.learnButton}
            onPress={handleLearnAboutStroke}
            activeOpacity={0.8}
          >
            <Text style={styles.learnButtonText}>PELAJARI TENTANG STROKE!</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.repeatButton}
            onPress={handleResetScreening}
            activeOpacity={0.8}
          >
            <Text style={styles.repeatButtonText}>Ulangi</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Screening Form Screen
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SKRINING RISIKO STROKE</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.descriptionBox}>
          <Text style={styles.descriptionText}>
            <Text style={styles.boldText}>Petunjuk Pengisian:</Text>
            {'\n'}Pilih satu jawaban yang paling sesuai dengan kondisi anda pada setiap pertanyaan. Total skor akan dihitung otomatis setelah semua pertanyaan dijawab.
          </Text>
        </View>

        {screeningQuestions.map((question) => (
          <View key={question.id} style={styles.questionContainer}>
            <Text style={styles.questionText}>
              {question.id}. {question.question}
            </Text>
            {question.options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  screeningAnswers[question.id] === option.value && styles.optionButtonSelected,
                ]}
                onPress={() => handleAnswerChange(question.id, option.value)}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View style={[
                    styles.radioButton,
                    screeningAnswers[question.id] === option.value && styles.radioButtonSelected,
                  ]}>
                    {screeningAnswers[question.id] === option.value && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <Text style={[
                    styles.optionText,
                    screeningAnswers[question.id] === option.value && styles.optionTextSelected,
                  ]}>
                    {option.label}. {option.text}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: Object.keys(screeningAnswers).length === screeningQuestions.length
                ? '#8BCDF0'
                : '#E0E0E0',
            },
          ]}
          onPress={handleSubmitScreening}
          disabled={
            Object.keys(screeningAnswers).length !== screeningQuestions.length || isSubmittingScreening
          }
        >
          {isSubmittingScreening ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.submitButtonText}>Hitung Hasil Skrining</Text>
          )}
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    textTransform: 'uppercase',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  descriptionBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    padding: 16,
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
    textAlign: 'justify',
  },
  boldText: {
    fontWeight: 'bold',
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    lineHeight: 20,
  },
  optionButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#F0F8FF',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#4CAF50',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  optionText: {
    fontSize: 13,
    color: '#000',
    flex: 1,
    lineHeight: 18,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  // Screening Result Screen Styles
  resultHeader: {
    backgroundColor: '#8BCDF0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  resultHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    textTransform: 'uppercase',
    flex: 1,
    textAlign: 'center',
  },
  resultScrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  resultHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    marginTop: 8,
  },
  riskResultBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  riskScoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  riskCategoryText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  recommendationBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    padding: 16,
    marginBottom: 20,
  },
  recommendationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recommendationText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
    flex: 1,
    marginRight: 8,
  },
  warningIcon: {
    marginTop: 2,
  },
  learnButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  learnButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  repeatButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    minWidth: 100,
  },
  repeatButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default StrokeScreeningScreen;













