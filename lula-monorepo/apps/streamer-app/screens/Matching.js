import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Animated, {
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    useSharedValue,
    interpolate,
    Easing,
    withSpring,
    useAnimatedProps
} from 'react-native-reanimated';

const AnimatedText = Animated.createAnimatedComponent(Text);

const Matching = () => {
    const navigation = useNavigation();
    const headingOpacity = useSharedValue(0);
    const circleProgress = useSharedValue(0);
    const counterValue = useSharedValue(0);

    useEffect(() => {
        // Start animations sequence
        headingOpacity.value = withSequence(
            withDelay(300, withSpring(1))
        );

        // Circle drawing animation
        circleProgress.value = withDelay(1000,
            withTiming(1, {
                duration: 1500,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            })
        );

        // Counter animation
        counterValue.value = withDelay(2500,
            withTiming(156, {
                duration: 1000,
                easing: Easing.out(Easing.cubic),
            })
        );

        // Navigate after animations
        const pageChange = setTimeout(() => {
            navigation.navigate('StartCalling');
        }, 4500);

        return () => clearTimeout(pageChange);
    }, []);

    const headingStyle = useAnimatedStyle(() => ({
        opacity: headingOpacity.value,
        transform: [
            {
                translateY: interpolate(
                    headingOpacity.value,
                    [0, 1],
                    [-20, 0]
                )
            }
        ]
    }));

    const circleStyle = useAnimatedStyle(() => ({
        width: 200,
        height: 200,
        borderRadius: 200,
        backgroundColor: 'rgba(255, 255, 255, 0)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
        transform: [{ scale: interpolate(circleProgress.value, [0, 1], [0.8, 1]) }],
    }));

    const dashStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 200,
        borderWidth: 2,
        borderColor: 'white',
        opacity: 0.3,
        transform: [{ rotate: `${circleProgress.value * 360}deg` }],
    }));

    const animatedTextProps = useAnimatedProps(() => {
        return {
            text: Math.round(counterValue.value).toString(),
        };
    });

    return (
        <ImageBackground
            source={require('../assets/images/login/bg.png')}
            style={styles.container}
        >
            <LinearGradient
                colors={['rgba(97, 86, 226, 0.9)', 'rgba(171, 73, 161, 0.9)']}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <Animated.Text style={[styles.heading, headingStyle]}>
                        Looking for the perfect one
                    </Animated.Text>
                    <View style={styles.circleContainer}>
                        <View style={styles.circleParent}>
                            <Animated.View style={[styles.circle, circleStyle]}>
                                <Animated.View style={dashStyle} />
                                <AnimatedText
                                    animatedProps={animatedTextProps}
                                    style={styles.matchCount}
                                >
                                    0
                                </AnimatedText>
                                <Text style={styles.matchText}>Perfect matches For You</Text>
                            </Animated.View>
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    gradient: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
    },
    content: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heading: {
        color: 'white',
        fontSize: 20,
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: 20,
    },
    circleContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    circleParent: {
        width: 240,
        height: 240,
        borderRadius: 200,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    circle: {
        width: 200,
        height: 200,
        borderRadius: 200,
        backgroundColor: 'rgba(255, 255, 255, 0)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
        overflow: 'hidden',
    },
    matchCount: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
    },
    matchText: {
        color: 'white',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 5,
    }
});

export default Matching;