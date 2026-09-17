<script setup lang="ts">
import { computed } from 'vue'
import type { Competency, LessonPlan } from '@/types'
import { formatDate, romanQuarter } from '@/lib/format'

const props = defineProps<{
  plan: LessonPlan
  competency: Competency | null
  teacherName: string
  school: string
}>()

const letters = 'abcdefghijklmnopqrstuvwxyz'

const totalMinutes = computed(() =>
  props.plan.sections.reduce((sum, s) => sum + s.minutes, 0),
)
</script>

<template>
  <div class="lp-doc">
    <header class="lp-doc__masthead">
      <div class="lp-doc__crest" aria-hidden="true">DepEd</div>
      <div class="lp-doc__masthead-text">
        <p class="lp-doc__eyebrow">Department of Education</p>
        <h1 class="lp-doc__title">Daily Lesson Plan</h1>
        <p class="lp-doc__subtitle">Mathematics &middot; {{ plan.grade }}</p>
      </div>
    </header>

    <table class="lp-doc__meta" role="presentation">
      <tbody>
        <tr>
          <th>School</th>
          <td>{{ school || '—' }}</td>
          <th>Grade Level</th>
          <td>{{ plan.grade }}</td>
        </tr>
        <tr>
          <th>Teacher</th>
          <td>{{ teacherName || '—' }}</td>
          <th>Learning Area</th>
          <td>Mathematics</td>
        </tr>
        <tr>
          <th>Teaching Date</th>
          <td>{{ formatDate(plan.updatedAt) }}</td>
          <th>Quarter</th>
          <td>{{ romanQuarter(plan.quarter) }}</td>
        </tr>
        <tr>
          <th>Time Allotment</th>
          <td>{{ plan.duration }} minutes</td>
          <th>Instructional Model</th>
          <td>{{ plan.templateName }}</td>
        </tr>
      </tbody>
    </table>

    <h2 class="lp-doc__lesson-title">{{ plan.title }}</h2>
    <p class="lp-doc__topic">Topic: {{ plan.topic }}</p>

    <section class="lp-doc__section">
      <h3 class="lp-doc__heading">I. Objectives</h3>
      <p class="lp-doc__lead">At the end of the lesson, the learners should be able to:</p>
      <ol class="lp-doc__list lp-doc__list--numbered">
        <li v-for="(objective, i) in plan.objectives" :key="i">{{ objective }}</li>
      </ol>
      <p v-if="competency" class="lp-doc__competency">
        <strong>Learning Competency ({{ competency.code }}):</strong>
        {{ competency.description }}
      </p>
    </section>

    <section class="lp-doc__section">
      <h3 class="lp-doc__heading">II. Learning Resources</h3>
      <ul class="lp-doc__list lp-doc__list--bulleted">
        <li v-for="item in plan.materials" :key="item">{{ item }}</li>
      </ul>
    </section>

    <section class="lp-doc__section lp-doc__section--procedures">
      <h3 class="lp-doc__heading">
        III. Procedures
        <span class="lp-doc__heading-note">({{ plan.templateName }} &mdash; {{ totalMinutes }} min)</span>
      </h3>
      <div v-for="(section, i) in plan.sections" :key="section.key" class="lp-doc__procedure">
        <p class="lp-doc__procedure-title">
          {{ letters[i] }}. {{ section.title }}
          <span class="lp-doc__procedure-minutes">{{ section.minutes }} min</span>
        </p>
        <p class="lp-doc__procedure-body">{{ section.body }}</p>
      </div>
    </section>

    <section class="lp-doc__section">
      <h3 class="lp-doc__heading">IV. Evaluation</h3>
      <p>{{ plan.assessment }}</p>
    </section>

    <section class="lp-doc__section">
      <h3 class="lp-doc__heading">V. Assignment</h3>
      <p>{{ plan.assignment }}</p>
    </section>

    <section class="lp-doc__section">
      <h3 class="lp-doc__heading">VI. Remarks</h3>
      <p>{{ plan.remarks || '—' }}</p>
    </section>

    <footer class="lp-doc__signoff">
      <div class="lp-doc__signature">
        <p class="lp-doc__signature-name">{{ teacherName || '—' }}</p>
        <p class="lp-doc__signature-label">Teacher, {{ plan.grade }}</p>
      </div>
      <div class="lp-doc__signature">
        <p class="lp-doc__signature-name">&nbsp;</p>
        <p class="lp-doc__signature-label">Noted by: School Head / Master Teacher</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.lp-doc {
  width: 100%;
  max-width: 794px;
  margin: 0 auto;
  padding: 48px 56px;
  background: #ffffff;
  color: #1a1a1a;
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 13px;
  line-height: 1.55;
}

.lp-doc__masthead {
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 2px solid #1a1a1a;
  padding-bottom: 14px;
  margin-bottom: 18px;
}

.lp-doc__crest {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: 1.5px solid #1a1a1a;
  border-radius: 999px;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-align: center;
}

.lp-doc__eyebrow {
  margin: 0;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #4a4a4a;
}

.lp-doc__title {
  margin: 2px 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.lp-doc__subtitle {
  margin: 0;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  font-size: 11px;
  color: #4a4a4a;
}

.lp-doc__meta {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  font-size: 11.5px;
}

.lp-doc__meta th,
.lp-doc__meta td {
  border: 1px solid #b8b8b8;
  padding: 6px 10px;
  text-align: left;
  vertical-align: top;
}

.lp-doc__meta th {
  width: 15%;
  background: #f3f2ee;
  font-weight: 600;
  color: #3a3a3a;
  white-space: nowrap;
}

.lp-doc__meta td {
  width: 35%;
}

.lp-doc__lesson-title {
  margin: 0 0 2px;
  font-size: 16px;
  font-weight: 700;
  text-align: center;
}

.lp-doc__topic {
  margin: 0 0 20px;
  font-size: 12px;
  text-align: center;
  color: #4a4a4a;
  font-style: italic;
}

.lp-doc__section {
  margin-bottom: 16px;
  break-inside: avoid;
}

.lp-doc__heading {
  margin: 0 0 6px;
  padding-bottom: 3px;
  border-bottom: 1px solid #c9c9c9;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.lp-doc__heading-note {
  font-weight: 400;
  text-transform: none;
  letter-spacing: normal;
  color: #6a6a6a;
}

.lp-doc__lead {
  margin: 0 0 6px;
  font-style: italic;
  color: #3a3a3a;
}

.lp-doc__list {
  margin: 0;
  padding-left: 22px;
}

.lp-doc__list--numbered {
  list-style-type: decimal;
}

.lp-doc__list--bulleted {
  list-style-type: disc;
}

.lp-doc__list li {
  margin-bottom: 4px;
  display: list-item;
}

.lp-doc__competency {
  margin: 10px 0 0;
  padding: 8px 10px;
  background: #f7f6f2;
  border-left: 3px solid #1a1a1a;
  font-size: 12px;
}

.lp-doc__procedure {
  margin-bottom: 10px;
  break-inside: avoid;
}

.lp-doc__procedure-title {
  margin: 0 0 2px;
  font-weight: 700;
}

.lp-doc__procedure-minutes {
  margin-left: 8px;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  font-size: 10.5px;
  font-weight: 400;
  color: #6a6a6a;
}

.lp-doc__procedure-body {
  margin: 0;
}

.lp-doc__signoff {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  margin-top: 40px;
  padding-top: 16px;
}

.lp-doc__signature {
  flex: 1;
  text-align: center;
}

.lp-doc__signature-name {
  margin: 0 0 2px;
  padding-bottom: 4px;
  border-bottom: 1px solid #1a1a1a;
  font-weight: 700;
  min-height: 1.2em;
}

.lp-doc__signature-label {
  margin: 4px 0 0;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  font-size: 10.5px;
  color: #6a6a6a;
}
</style>
