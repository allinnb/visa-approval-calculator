import QuestionnaireForm from '@/components/questionnaire-form';

export default function Page({
  params,
}: {
  params: Promise<{ region: string }>;
}) {
  return <QuestionnaireForm params={params} />;
}
