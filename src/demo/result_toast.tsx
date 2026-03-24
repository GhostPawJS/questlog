import { useCallback, useState } from 'preact/hooks';

interface Toast {
	id: number;
	ok: boolean;
	title: string;
	body?: string;
}

let nextId = 0;

export function useToastState() {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const push = useCallback((msg: { ok: boolean; title: string; body?: string }) => {
		const id = ++nextId;
		setToasts((prev) => [...prev, { id, ...msg }]);
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, 4000);
	}, []);

	return { toasts, push };
}

export function ToastStack({ toasts }: { toasts: Toast[] }) {
	if (toasts.length === 0) return null;
	return (
		<div class="toast-stack">
			{toasts.map((t) => (
				<div key={t.id} class={`toast ${t.ok ? 'ok' : 'fail'}`}>
					<div class="toast-title">{t.title}</div>
					{t.body ? <div class="toast-body">{t.body}</div> : null}
				</div>
			))}
		</div>
	);
}
