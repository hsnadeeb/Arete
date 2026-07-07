import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useHasan } from '../data/context';
import { Section, MetricCard, ClinicalRow, GLP1Item, MetabolicItem, ProgressBar, ChartBars, GlucoseTip, getScoreColor, TwoCol } from '../components/Scores';

export default function ClinicalHealthScreen() {
  const { data: d } = useHasan();
  const ch = d.clinicalHealth;

  return (
    <ScreenWrapper
      title="Clinical Health"
      icon="🔬"
      subtitle="Evidence-based lifestyle medicine · All biomarkers tracked against clinical targets."
    >
      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <MetricCard
          label="Prediabetes Score"
          value={`${ch.prediabetes.progressScore}`}
          trend={`~${ch.prediabetes.monthsToReversal} months to reversal`}
          trendColor={getScoreColor(ch.prediabetes.progressScore)}
        />
        <MetricCard
          label="DASH Adherence"
          value={`${ch.bloodPressure.dashDietAdherence}%`}
          trend="Target: >80%"
          trendColor={getScoreColor(ch.bloodPressure.dashDietAdherence)}
        />
        <MetricCard
          label="Liver Health"
          value={`${ch.liverHealth.reversalProbability}%`}
          trend="Reversal probability"
          trendColor={getScoreColor(ch.liverHealth.reversalProbability)}
        />
        <MetricCard
          label="Metabolic Risk"
          value={`${ch.continuousImprovement.criteriaMet}/3`}
          trend="Criteria met (≥3 = syndrome)"
          trendColor={ch.continuousImprovement.criteriaMet >= 2 ? '#d9730d' : '#0a8c2e'}
        />
      </View>

      <TwoCol>
        {/* Left */}
        <View style={{ flex: 1 }}>
          {/* Prediabetes Reversal */}
          <Section title="🩸 Prediabetes Reversal">
            <ClinicalRow
              label="HbA1c"
              value={`${ch.prediabetes.hba1c.current}%`}
              target={`Target: <${ch.prediabetes.hba1c.target}%`}
              valueColor={ch.prediabetes.hba1c.current > ch.prediabetes.hba1c.target ? '#d9730d' : '#0a8c2e'}
              status={ch.prediabetes.hba1c.current > ch.prediabetes.hba1c.target ? 'warning' : 'good'}
            />
            <ClinicalRow
              label="Fasting Glucose"
              value={`${ch.prediabetes.fastingGlucose.current}`}
              target="Target: <100 mg/dL"
              valueColor={ch.prediabetes.fastingGlucose.current >= 100 ? '#d9730d' : '#0a8c2e'}
              status={ch.prediabetes.fastingGlucose.current >= 100 ? 'warning' : 'good'}
            />
            <ProgressBar progress={ch.prediabetes.progressScore} color="#6366f1" height={10} style={{ marginVertical: 10 }} />
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#37352f', marginBottom: 8 }}>Reversal strategies:</Text>
            {ch.prediabetes.reversalStrategies.map((s, i) => {
              const pct = parseInt((s.progress.match(/\d+/)?.[0] || '0').toString());
              return (
                <View key={i} style={styles.reversalRow}>
                  <Text style={{ flex: 1, fontSize: 12, color: '#37352f' }}>{s.strategy}</Text>
                  <View style={{ width: 100 }}>
                    <ProgressBar progress={Math.min(pct, 100)} color="#6366f1" height={4} />
                  </View>
                  <Text style={{ fontSize: 10, color: '#9b9a97', width: 80, textAlign: 'right' }}>{s.progress}</Text>
                </View>
              );
            })}
          </Section>

          {/* Liver Health */}
          <Section title="🧬 Liver Health (NAFLD)">
            {(['alt', 'ast', 'ggt'] as const).map(m => {
              const marker = ch.liverHealth[m];
              return (
                <ClinicalRow
                  key={m}
                  label={m.toUpperCase()}
                  value={`${marker.current}`}
                  target={`Target: <${marker.target} ${marker.unit}`}
                  valueColor={marker.current > marker.target ? '#d9730d' : '#0a8c2e'}
                  status={marker.current > marker.target ? 'warning' : 'good'}
                />
              );
            })}
            <Text style={{ fontSize: 11, color: '#9b9a97', marginTop: 6 }}>
              Diagnosis: {ch.liverHealth.condition} · {ch.liverHealth.interventions[0].compliance}% compliance with sugar reduction
            </Text>
          </Section>
        </View>

        {/* Right */}
        <View style={{ flex: 1 }}>
          {/* Blood Pressure */}
          <Section title={`💉 Blood Pressure — ${ch.bloodPressure.category}`}>
            <View style={[styles.chartHost, { height: 90 }]}>
              {ch.bloodPressure.bpReadings.map((r, i) => {
                const maxBP = Math.max(...ch.bloodPressure.bpReadings.map(x => x.sys));
                const minBP = Math.min(...ch.bloodPressure.bpReadings.map(x => x.sys));
                const range = maxBP - minBP || 1;
                const h = ((r.sys - minBP) / range) * 100;
                return (
                  <View key={i} style={styles.chartGroup}>
                    <View style={[styles.chartBar, { height: `${100 - h}%`, backgroundColor: '#0b6bcf', maxWidth: 25 }]}>
                      <Text style={styles.chartBarValue}>{r.sys}</Text>
                    </View>
                    <Text style={styles.chartBarLabel}>{r.date}</Text>
                  </View>
                );
              })}
            </View>
            <ClinicalRow
              label="Current"
              value={`${ch.bloodPressure.systolic}/${ch.bloodPressure.diastolic}`}
              target="Target: <120/80"
              status="warning"
            />
          </Section>

          {/* Metabolic Syndrome */}
          <Section title="⚡ Metabolic Syndrome Check">
            <View style={styles.metabolicGrid}>
              {Object.entries(ch.continuousImprovement.metabolicSyndromeCriteria)
                .filter(([k]) => k !== 'notes' && k !== 'criteriaMet' && k !== 'criteriaForDiagnosis')
                .map(([k, v]) => (
                  <MetabolicItem
                    key={k}
                    label={k.replace(/([A-Z])/g, ' $1').trim()}
                    value={v.value}
                    met={v.met}
                  />
                ))}
            </View>
            <View style={styles.metabolicNote}>
              <Text style={{ fontSize: 11, color: '#dc2626', fontWeight: '500' }}>
                ⚠️ {ch.continuousImprovement.notes}
              </Text>
            </View>
          </Section>

          {/* GLP-1 Boosters */}
          <Section title="🧬 GLP-1 Natural Boosters">
            {ch.glp1NaturalBoosters.boosters.map((b, i) => (
              <GLP1Item key={i} action={b.action} effect={b.glp1Effect} adherence={b.adherence} />
            ))}
          </Section>
        </View>
      </TwoCol>

      {/* Glucose Management */}
      <Section title="🍽️ Glucose Management Tips">
        {ch.glucoregulation.recommendations.map((r, i) => (
          <GlucoseTip key={i} text={r} />
        ))}
      </Section>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  chartHost: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingVertical: 8,
  },
  chartGroup: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '80%',
    borderRadius: 3,
    justifyContent: 'flex-start',
    alignItems: 'center',
    minHeight: 4,
    position: 'relative',
  },
  chartBarValue: {
    position: 'absolute',
    top: -14,
    fontSize: 10,
    color: '#9b9a97',
    fontWeight: '500',
  },
  chartBarLabel: {
    fontSize: 9,
    color: '#b3b3af',
    marginTop: 4,
  },
  reversalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0ee',
  },
  metabolicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  metabolicNote: {
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    marginTop: 4,
  },
});
