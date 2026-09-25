import { useRouter } from 'expo-router';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import BookcaseBackground from '../components/BookcaseBackground';

export default function StatsScreen() {
	const router = useRouter();

	return (
		<BookcaseBackground>
			<View style={styles.overlay} />
			<SafeAreaView style={styles.container}>
				<Text style={styles.title}>Stats screen</Text>
				<Text style={styles.subtitle}>statter screener</Text>
				<TouchableOpacity
					style={styles.button}
					onPress={() => router.replace('/mainmenu')}
					activeOpacity={0.8}
				>
					<Text style={styles.buttonText}>return button</Text>
				</TouchableOpacity>
			</SafeAreaView>
		</BookcaseBackground>
	);
}

const styles = StyleSheet.create({
	background: {
		flex: 1,
	},
	overlay: {
		...StyleSheet.absoluteFill,
		backgroundColor: 'rgba(0, 0, 0, 0.55)',
	},
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 16,
	},
	title: {
		color: '#ffffff',
		fontSize: 28,
		fontWeight: '800',
	},
	subtitle: {
		color: '#d1d5db',
		fontSize: 18,
	},
	button: {
		backgroundColor: '#ffffff',
		borderRadius: 8,
		paddingHorizontal: 24,
		paddingVertical: 14,
	},
	buttonText: {
		color: '#111827',
		fontWeight: '700',
	},
});
