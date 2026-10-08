import { type FC } from 'react';
import { Text, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { styles } from './styles';

type Props = {
  icon: FC<SvgProps>;
  title: string;
  value?: string;
  lines?: string[];
};

export function LessonFact({ icon: FactIcon, title, value, lines }: Props) {
  return (
    <View style={styles.fact}>
      <View style={styles.icon}>
        <FactIcon />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {value ? <Text style={styles.body}>{value}</Text> : null}
        {lines && lines.length > 0 ? (
          <View style={styles.list}>
            {lines.map((line, index) => (
              <View key={`${index}-${line}`} style={styles.item}>
                <View style={styles.bullet} />
                <Text style={styles.itemText}>{line}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
