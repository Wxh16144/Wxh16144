window.addEventListener("DOMContentLoaded", () => {
  $("footer").prepend(
    $("<img>", {
      src: `https://api.visitorbadge.io/api/visitors?path=${window.location.hostname}&style=plastic`,
      alt: "Visitor Statistics"
    })
  );
});