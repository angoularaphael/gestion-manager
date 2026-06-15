import { NextResponse } from 'next/server';
import { getFaqList, matchFaq } from '../../../../lib/faq';
import { trackChatbotEvent } from '../../../../lib/chatbot';
import { chatbotCorsHeaders } from '../../../../lib/chatbotConfig';

function clientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null
  );
}

export async function OPTIONS(request) {
  return new NextResponse(null, { status: 204, headers: chatbotCorsHeaders(request) });
}

/** GET ?q=... — liste FAQ ou recherche */
export async function GET(request) {
  const cors = chatbotCorsHeaders(request);
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  if (!q) {
    return NextResponse.json({ faq: getFaqList() }, { headers: cors });
  }

  const result = matchFaq(q);
  const meta = {
    sessionId: searchParams.get('sessionId'),
    referrer: request.headers.get('referer'),
    userAgent: request.headers.get('user-agent'),
    ip: clientIp(request),
  };

  try {
    if (result) {
      await trackChatbotEvent({
        eventType: 'faq_hit',
        faqQuestion: result.match.question,
        ...meta,
      });
      return NextResponse.json(
        {
          match: true,
          question: result.match.question,
          answer: result.match.answer,
          id: result.match.id,
        },
        { headers: cors }
      );
    }

    await trackChatbotEvent({
      eventType: 'faq_miss',
      faqQuestion: q.slice(0, 512),
      ...meta,
    });
    return NextResponse.json({ match: false }, { headers: cors });
  } catch (e) {
    if (result) {
      return NextResponse.json(
        {
          match: true,
          question: result.match.question,
          answer: result.match.answer,
          id: result.match.id,
        },
        { headers: cors }
      );
    }
    return NextResponse.json({ match: false, error: e.message }, { headers: cors });
  }
}
