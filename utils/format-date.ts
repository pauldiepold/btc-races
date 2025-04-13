export default function (dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}
