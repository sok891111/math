export default function PlatformerRedirectPage() {
  return null;
}

export async function getServerSideProps({ params }) {
  const { userId } = params;
  return {
    redirect: {
      destination: `/${userId}`,
      permanent: false,
    },
  };
}
